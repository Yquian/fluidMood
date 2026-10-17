"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type FluidBackgroundProps = {
  /** 颜色 A */
  color1?: string;
  /** 颜色 B */
  color2?: string;
  /** 流动速度 */
  speed?: number;
  /** 湍流强度 */
  turbulence?: number;
  /** 冻结流动：停止时间推进，并立即吸附到当前目标颜色 */
  frozen?: boolean;
  /** 冻结时收缩到的区域（CSS clip-path），不传则铺满全屏 */
  clipPath?: string;
  className?: string;
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    // 直接输出裁剪空间坐标，保证平面始终铺满屏幕
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float u_time;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform float u_turbulence;

  varying vec2 vUv;

  // ---- Simplex Noise 3D (Ashima Arts) ----
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;

    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // ---- 分形噪声 ----
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p);
      p *= 2.02;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;
    // u_time 已在 CPU 端按当前流速积分，变速时相位连续，不会突然加速
    float t = u_time;

    // 第一次域扭曲：让噪声沿自身梯度流动
    vec2 q = vec2(
      fbm(vec3(uv * 2.5, t * 0.35)),
      fbm(vec3(uv * 2.5 + vec2(3.7, 1.2), t * 0.3 + 2.6))
    );

    // 第二次域扭曲：叠加湍流，形成拉丝般的流体细节
    vec2 warpedUv = uv * 3.5 + q * u_turbulence;
    vec2 r = vec2(
      fbm(vec3(warpedUv, t * 0.42 + 4.1)),
      fbm(vec3(warpedUv + vec2(5.2, 8.3), t * 0.38 + 7.7))
    );

    float n = fbm(vec3(uv * 2.0 + r * u_turbulence * 0.8 + q * 0.35, t * 0.5));

    // 情绪色：两种颜色随噪声混合
    float blend = smoothstep(-0.55, 0.65, n);
    vec3 flowColor = mix(u_color1, u_color2, blend);

    // 向灰色靠拢，降低饱和度，避免颜色过艳
    float gray = dot(flowColor, vec3(0.299, 0.587, 0.114));
    flowColor = mix(vec3(gray), flowColor, 0.65);

    // 纯白底：保留一层很淡的底色，再叠加流动的情绪色，保证颜色始终可辨
    float flow = smoothstep(-0.4, 0.6, n);
    vec3 color = mix(vec3(1.0), flowColor, 0.08 + flow * 0.55);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const FluidMaterial = shaderMaterial(
  {
    u_time: 0,
    u_color1: new THREE.Color("#0a0a1f"),
    u_color2: new THREE.Color("#6d5efc"),
    u_turbulence: 1.5,
  },
  vertexShader,
  fragmentShader
);

// GLSL 直接输出到屏幕，保持与传入的十六进制色值一致
const toColor = (value: string) =>
  new THREE.Color().setStyle(value, THREE.LinearSRGBColorSpace);

type FluidPlaneProps = {
  color1: string;
  color2: string;
  speed: number;
  turbulence: number;
  frozen: boolean;
};

// 每帧向目标值逼近的比例，越小过渡越慢
const SMOOTHING = 0.02;

function FluidPlane({
  color1,
  color2,
  speed,
  turbulence,
  frozen,
}: FluidPlaneProps) {
  const [material] = useState(() => {
    const instance = new FluidMaterial();
    instance.uniforms.u_color1.value = toColor(color1);
    instance.uniforms.u_color2.value = toColor(color2);
    instance.uniforms.u_turbulence.value = turbulence;
    return instance;
  });

  // 目标值只在 props 变化时重新解析，避免每帧创建 Color 对象
  const targetColor1 = useMemo(() => toColor(color1), [color1]);
  const targetColor2 = useMemo(() => toColor(color2), [color2]);

  // 当前值，初始为传入的默认值
  const currentColor1 = useRef(toColor(color1));
  const currentColor2 = useRef(toColor(color2));
  const currentSpeed = useRef(speed);
  const currentTurbulence = useRef(turbulence);
  // 速度积分得到的时间相位，保证变速时画面不会跳变
  const flowTime = useRef(0);
  const wasFrozen = useRef(false);

  useFrame((_, delta) => {
    if (frozen) {
      // 冻结瞬间直接吸附到 AI 颜色，并停止时间推进
      if (!wasFrozen.current) {
        currentColor1.current.copy(targetColor1);
        currentColor2.current.copy(targetColor2);
        currentTurbulence.current = turbulence;
        wasFrozen.current = true;
      }
    } else {
      wasFrozen.current = false;

      // 线性插值：current += (target - current) * SMOOTHING
      currentColor1.current.lerp(targetColor1, SMOOTHING);
      currentColor2.current.lerp(targetColor2, SMOOTHING);
      currentSpeed.current += (speed - currentSpeed.current) * SMOOTHING;
      currentTurbulence.current +=
        (turbulence - currentTurbulence.current) * SMOOTHING;

      // 限制单帧步长，避免切回标签页时相位一次性跳太远
      flowTime.current += Math.min(delta, 0.1) * currentSpeed.current;
    }

    material.uniforms.u_time.value = flowTime.current;
    material.uniforms.u_color1.value = currentColor1.current;
    material.uniforms.u_color2.value = currentColor2.current;
    material.uniforms.u_turbulence.value = currentTurbulence.current;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export function FluidBackground({
  color1 = "#0a0a1f",
  color2 = "#6d5efc",
  speed = 0.6,
  turbulence = 1.5,
  frozen = false,
  clipPath,
  className,
}: FluidBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10", className)}
    >
      {/* 收缩到卡片区域：白底之上留下被裁剪的冻结流体 */}
      <div
        className="h-full w-full transition-[clip-path] duration-1000 ease-out"
        style={{ clipPath: clipPath ?? "inset(0px round 0px)" }}
      >
        <Canvas
          orthographic
          camera={{ position: [0, 0, 1] }}
          dpr={[1, 1.75]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <FluidPlane
            color1={color1}
            color2={color2}
            speed={speed}
            turbulence={turbulence}
            frozen={frozen}
          />
        </Canvas>
      </div>
    </div>
  );
}
