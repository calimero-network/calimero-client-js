import { CalimeroApplication } from '../src/experimental/app';
import { CalimeroApp } from '../src/experimental/types';
import { getAppEndpointKey } from '../src/storage';
import { Context } from '../src/experimental/types';

// Polyfill for Browser APIs in Node.js test environment
if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(chunks: BlobPart[], options?: BlobPropertyBag) {}
  } as any;
}

if (typeof global.File === 'undefined') {
  global.File = class File extends Blob {
    constructor(
      chunks: BlobPart[],
      filename: string,
      options?: BlobPropertyBag,
    ) {
      super(chunks, options);
      this.name = filename;
    }
    name: string;
  } as any;
}

jest.mock('../src/storage', () => ({
  getAppEndpointKey: jest.fn(),
}));

const mockNode = {
  deleteContext: jest.fn().mockResolvedValue({ data: null, error: null }),
};
const mockRpc = {
  execute: jest.fn().mockResolvedValue({ data: null, error: null }),
};
const mockBlob = {
  uploadBlob: jest
    .fn()
    .mockResolvedValue({ data: { blobId: 'test-blob' }, error: null }),
  downloadBlob: jest.fn().mockResolvedValue(new Blob()),
};

const mockApiClient = {
  node: () => mockNode,
  rpc: () => mockRpc,
  blob: () => mockBlob,
};

const mockSubscriptionsClient = {
  subscribe: jest.fn(),
  addCallback: jest.fn(),
};

describe('Experimental CalimeroApp API', () => {
  let app: CalimeroApp;

  const testContext: Context = {
    contextId: 'test-context',
    executorId: 'test-executor',
    applicationId: 'test-app',
  };

  beforeEach(() => {
    (getAppEndpointKey as jest.Mock).mockReturnValue('https://api.test.com');
    app = new CalimeroApplication(
      mockApiClient as any,
      'test-client-id',
      mockSubscriptionsClient as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.node().deleteContext with the correct contextId', async () => {
    await app.deleteContext(testContext);
    expect(mockNode.deleteContext).toHaveBeenCalledWith(testContext.contextId);
  });

  it('should call apiClient.rpc().execute with the correct parameters', async () => {
    const method = 'testMethod';
    const params = { key: 'value' };
    await app.execute(testContext, method, params);
    expect(mockRpc.execute).toHaveBeenCalledWith({
      contextId: testContext.contextId,
      method,
      argsJson: params,
      executorPublicKey: testContext.executorId,
    });
  });

  // Blob API Interaction Tests
  it('should call apiClient.blob().uploadBlob with the file', async () => {
    const file = new File([], 'test.txt');
    await app.uploadBlob(file);
    expect(mockBlob.uploadBlob).toHaveBeenCalledWith(file, undefined);
  });

  it('should call apiClient.blob().downloadBlob with the correct blobId', async () => {
    const blobId = 'test-blob-id';
    await app.downloadBlob(blobId);
    expect(mockBlob.downloadBlob).toHaveBeenCalledWith(blobId);
  });

  // Subscriptions API Interaction Tests
  it('should call subscriptionsClient.subscribe with the correct contexts', () => {
    const contexts = [testContext];
    app.subscribe(contexts);
    expect(mockSubscriptionsClient.subscribe).toHaveBeenCalledWith(
      contexts.map((c) => c.contextId),
      undefined,
    );
  });

  it('should call subscriptionsClient.addCallback with the provided callback', () => {
    const callback = jest.fn();
    app.addCallback(callback);
    expect(mockSubscriptionsClient.addCallback).toHaveBeenCalledWith(
      callback,
      undefined,
    );
  });
});
