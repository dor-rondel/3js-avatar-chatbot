import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-three/fiber', () => ({
  useFrame: () => undefined,
}));

vi.mock('@react-three/drei', () => ({
  useAnimations: () => ({ actions: undefined, mixer: undefined }),
  // Preload calls happen at module load time.
  useGLTF: Object.assign(
    () => ({ nodes: { Hips: { quaternion: { clone: () => ({}) } } } }),
    { preload: () => undefined }
  ),
  useFBX: Object.assign(() => ({ animations: [undefined] }), {
    preload: () => undefined,
  }),
}));

vi.mock('@/lib/viseme/visemeEvents', () => ({
  subscribeToVisemes: () => () => undefined,
}));

vi.mock('@/lib/expressions/expressionEvents', () => ({
  subscribeToExpressions: () => () => undefined,
}));

vi.mock('@/lib/expressions/facialExpressions', () => ({
  facialExpressions: { default: {} },
  expressionMorphNames: [],
}));

describe('HarryAvatar', () => {
  it('exports a component', async () => {
    const importedModule = await import('.');
    expect(typeof importedModule.default).toBe('function');
  });
});
