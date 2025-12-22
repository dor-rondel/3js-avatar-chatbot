import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { act, render } from '@testing-library/react';
import { useChatAudioPlayback } from './useChatAudioPlayback';

const {
  MockAudio,
  mockPlay,
  connectAudioMock,
  processAudioMock,
  emitVisemeMock,
  emitExpressionMock,
  buildAudioSrcFromBase64Mock,
  requestAnimationFrameMock,
  cancelAnimationFrameMock,
  rafCallbacks,
} = vi.hoisted(() => {
  const mockPlay = vi.fn().mockResolvedValue(undefined);
  class MockAudio {
    src = '';
    play = mockPlay;
    pause = vi.fn();
    currentTime = 0;
    onended: (() => void) | null = null;
  }

  const connectAudioMock = vi.fn();
  const processAudioMock = vi.fn();

  const emitVisemeMock = vi.fn();
  const emitExpressionMock = vi.fn();

  type RafCallback = Parameters<typeof globalThis.requestAnimationFrame>[0];
  const rafCallbacks: RafCallback[] = [];
  const requestAnimationFrameMock = vi.fn((cb: RafCallback) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  });

  const cancelAnimationFrameMock = vi.fn();

  const buildAudioSrcFromBase64Mock = vi.fn(() => ({
    src: 'blob:mock-audio',
    objectUrl: 'blob:mock-audio',
  }));

  return {
    MockAudio,
    mockPlay,
    connectAudioMock,
    processAudioMock,
    emitVisemeMock,
    emitExpressionMock,
    buildAudioSrcFromBase64Mock,
    requestAnimationFrameMock,
    cancelAnimationFrameMock,
    rafCallbacks,
  };
});

vi.mock('wawa-lipsync', () => ({
  Lipsync: class LipsyncMock {
    connectAudio = connectAudioMock;
    processAudio = processAudioMock;
    viseme = '';
  },
}));

vi.mock('@/lib/viseme/visemeEvents', () => ({
  emitViseme: emitVisemeMock,
}));

vi.mock('@/lib/expressions/expressionEvents', () => ({
  emitExpression: emitExpressionMock,
}));

vi.mock('@/lib/expressions/facialExpressions', () => ({
  resolveExpressionForSentiment: (sentiment: string) => {
    if (sentiment === 'happy') {
      return 'smile';
    }
    return 'default';
  },
}));

vi.mock('@/lib/audio/buildAudioSrcFromBase64', () => ({
  buildAudioSrcFromBase64: buildAudioSrcFromBase64Mock,
}));

type HarnessProps = {
  // eslint-disable-next-line no-unused-vars
  onReady: (...args: [ReturnType<typeof useChatAudioPlayback>]) => void;
};

function Harness({ onReady }: HarnessProps) {
  const api = useChatAudioPlayback();
  onReady(api);
  return null;
}

const originalAudio = globalThis.Audio;
const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

beforeAll(() => {
  Object.defineProperty(globalThis, 'Audio', {
    configurable: true,
    value: MockAudio,
  });

  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    value: requestAnimationFrameMock,
  });

  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    value: cancelAnimationFrameMock,
  });
});

afterAll(() => {
  if (originalAudio) {
    Object.defineProperty(globalThis, 'Audio', {
      configurable: true,
      value: originalAudio,
    });
  } else {
    Reflect.deleteProperty(globalThis, 'Audio');
  }

  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    value: originalRequestAnimationFrame,
  });

  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    value: originalCancelAnimationFrame,
  });
});

beforeEach(() => {
  mockPlay.mockClear();
  connectAudioMock.mockClear();
  processAudioMock.mockClear();
  emitVisemeMock.mockClear();
  emitExpressionMock.mockClear();
  buildAudioSrcFromBase64Mock.mockClear();
  requestAnimationFrameMock.mockClear();
  cancelAnimationFrameMock.mockClear();
  rafCallbacks.length = 0;
});

describe('useChatAudioPlayback', () => {
  it('plays audio, emits expression, and starts the viseme loop', async () => {
    let api: ReturnType<typeof useChatAudioPlayback> | null = null;

    render(
      <Harness
        onReady={(readyApi) => {
          api = readyApi;
        }}
      />
    );

    await act(async () => {
      await api!.playResponseAudio({
        audio: { base64: 'YWJj', mimeType: 'audio/mpeg' },
        sentiment: 'happy',
      });
    });

    expect(buildAudioSrcFromBase64Mock).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(connectAudioMock).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrameMock).toHaveBeenCalled();

    // Cleanup emits default first, then the resolved expression.
    expect(emitExpressionMock).toHaveBeenNthCalledWith(1, 'default');
    expect(emitExpressionMock).toHaveBeenNthCalledWith(2, 'smile');

    // Simulate one animation frame to ensure the lipsync loop executes.
    const frame = rafCallbacks[0];
    frame?.(0);
    expect(processAudioMock).toHaveBeenCalledTimes(1);
    expect(emitVisemeMock).toHaveBeenCalled();
  });
});
