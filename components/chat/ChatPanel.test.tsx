import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ChatPanel as ChatPanelComponentType } from './ChatPanel';

const {
  sendChatRequestMock,
  mockPlay,
  createdAudios,
  resetAudioMocks,
  MockAudio,
  LipsyncMock,
  connectAudioMock,
  processAudioMock,
  emitVisemeMock,
  getLatestLipsyncInstance,
} = vi.hoisted(() => {
  const sendChatRequestMock = vi.fn();
  const mockPlay = vi.fn().mockResolvedValue(undefined);
  const emitVisemeMock = vi.fn();
  type CreatedAudio = {
    src: string;
    currentTime: number;
    onended: (() => void) | null;
  };
  const createdAudios: CreatedAudio[] = [];

  class MockAudio {
    src = '';
    load = vi.fn();
    play = mockPlay;
    pause = vi.fn();
    currentTime = 0;
    onended: (() => void) | null = null;

    constructor() {
      createdAudios.push(this);
    }
  }

  const connectAudioMock = vi.fn();
  const processAudioMock = vi.fn();
  const lipsyncInstances: LipsyncMock[] = [];

  class LipsyncMock {
    connectAudio = connectAudioMock;
    processAudio = processAudioMock;
    private currentViseme = '';

    constructor() {
      lipsyncInstances.push(this);
    }

    get viseme() {
      return this.currentViseme;
    }

    set viseme(value: string) {
      this.currentViseme = value;
    }
  }

  return {
    sendChatRequestMock,
    mockPlay,
    createdAudios,
    resetAudioMocks() {
      createdAudios.length = 0;
      mockPlay.mockReset();
      connectAudioMock.mockReset();
      processAudioMock.mockReset();
      emitVisemeMock.mockReset();
      lipsyncInstances.length = 0;
    },
    MockAudio,
    LipsyncMock,
    connectAudioMock,
    processAudioMock,
    emitVisemeMock,
    getLatestLipsyncInstance: () =>
      lipsyncInstances[lipsyncInstances.length - 1] ?? null,
  };
});

vi.mock('../../lib/chat/sendChatRequest', () => ({
  sendChatRequest: sendChatRequestMock,
}));

vi.mock('wawa-lipsync', () => ({
  Lipsync: LipsyncMock,
}));

vi.mock('../../lib/viseme/visemeEvents', () => ({
  emitViseme: emitVisemeMock,
}));

let ChatPanelComponent: typeof ChatPanelComponentType | null = null;

const originalAudio = globalThis.Audio;
const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
const originalCreateObjectURL = globalThis.URL?.createObjectURL;
const originalRevokeObjectURL = globalThis.URL?.revokeObjectURL;

const createObjectURLMock = vi.fn(() => 'blob:mock-audio');
const revokeObjectURLMock = vi.fn();

type RafCallback = NonNullable<
  Parameters<typeof globalThis.requestAnimationFrame>[0]
>;

const rafCallbacks: RafCallback[] = [];
const requestAnimationFrameMock = vi.fn((cb: RafCallback) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
});
const cancelAnimationFrameMock = vi.fn();

beforeAll(async () => {
  ({ ChatPanel: ChatPanelComponent } = await import('./ChatPanel'));

  Object.defineProperty(globalThis, 'Audio', {
    configurable: true,
    value: MockAudio,
  });

  if (globalThis.URL) {
    Object.defineProperty(globalThis.URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURLMock,
    });
  } else {
    Object.defineProperty(globalThis, 'URL', {
      configurable: true,
      value: {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      },
    });
  }

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

  if (originalCreateObjectURL) {
    Object.defineProperty(globalThis.URL!, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL,
    });
  } else if (globalThis.URL) {
    Reflect.deleteProperty(globalThis.URL, 'createObjectURL');
  }

  if (originalRevokeObjectURL) {
    Object.defineProperty(globalThis.URL!, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    });
  } else if (globalThis.URL) {
    Reflect.deleteProperty(globalThis.URL, 'revokeObjectURL');
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
  sendChatRequestMock.mockReset();
  resetAudioMocks();
  rafCallbacks.length = 0;
  requestAnimationFrameMock.mockClear();
  cancelAnimationFrameMock.mockClear();
  createObjectURLMock.mockClear();
  revokeObjectURLMock.mockClear();
});

const renderChatPanel = () => {
  if (!ChatPanelComponent) {
    throw new Error('ChatPanel failed to load');
  }

  return render(<ChatPanelComponent />);
};

describe('ChatPanel', () => {
  it('renders the conversational prompt and input placeholder', () => {
    renderChatPanel();

    expect(
      screen.getByText('Send Harry a message and he will respond in audio.')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Ask Harry anything/)
    ).toBeInTheDocument();
  });

  it('posts user text, plays audio, and wires lipsync', async () => {
    sendChatRequestMock.mockResolvedValueOnce({
      reply: 'Hi!',
      audio: { base64: 'YWJj', mimeType: 'audio/mpeg' },
    });
    renderChatPanel();

    const textarea = screen.getByLabelText('Message');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Wingardium Leviosa' } });
    });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    await waitFor(() => {
      expect(sendChatRequestMock).toHaveBeenCalledWith('Wingardium Leviosa');
      expect(mockPlay).toHaveBeenCalled();
      expect(createdAudios[0]?.src.startsWith('blob:')).toBe(true);
      expect(connectAudioMock).toHaveBeenCalledWith(createdAudios[0]);
      expect(requestAnimationFrameMock).toHaveBeenCalled();
    });

    const lipsyncInstance = getLatestLipsyncInstance();
    expect(lipsyncInstance).not.toBeNull();
    lipsyncInstance!.viseme = 'viseme_PP';
    if (createdAudios[0]) {
      createdAudios[0].currentTime = 1.23;
    }

    // Simulate one animation frame to ensure the lipsync loop executes.
    const frame = rafCallbacks[0];
    frame?.(0);
    expect(processAudioMock).toHaveBeenCalled();
    expect(emitVisemeMock).toHaveBeenCalledWith({
      label: 'viseme_PP',
      timestamp: createdAudios[0]?.currentTime ?? 0,
    });
  });
});
