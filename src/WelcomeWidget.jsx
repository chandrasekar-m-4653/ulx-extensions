import { useCallback, useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import PageLayout from './components/layout/PageLayout.jsx';
import PageHeader from './components/layout/PageHeader.jsx';

function hostValue(host, keys) {
  for (const key of keys) {
    if (host && host[key] !== undefined && host[key] !== null && host[key] !== '') {
      return String(host[key]);
    }
  }
  return 'Not provided';
}

function isBackstageAvailable() {
  return Boolean(
    typeof window !== 'undefined' &&
      window.ZBackstage &&
      window.ZBackstage.extension &&
      typeof window.ZBackstage.extension.init === 'function',
  );
}

export default function WelcomeWidget() {
  const [status, setStatus] = useState('loading');
  const [host, setHost] = useState(null);
  const [error, setError] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const initialize = useCallback(async () => {
    setStatus('loading');
    setError('');
    setHost(null);
    setIsPreview(false);

    try {
      if (!isBackstageAvailable()) {
        setIsPreview(true);
        setHost({ portalId: 'preview', spaceId: 'preview' });
        setStatus('ready');
        return;
      }

      const app = await window.ZBackstage.extension.init();
      setHost(app);
      setStatus('ready');
    } catch (cause) {
      console.error('Unable to initialize Backstage widget', cause);
      setError(
        cause && cause.message
          ? cause.message
          : 'Unable to initialize the Backstage widget.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <PageLayout maxWidth="max-w-3xl">
      <PageHeader
        title="Welcome widget"
        description="Starter surface for a Backstage space-settings extension. Replace this screen with the page you want to embed."
      />

      {status === 'loading' ? (
        <Message
          severity="info"
          className="w-full"
          text="Connecting to Backstage…"
        />
      ) : null}

      {status === 'error' ? (
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
          <Message
            severity="error"
            className="w-full"
            text={error || 'Unable to initialize the Backstage widget.'}
          />
          <div>
            <Button
              type="button"
              label="Try again"
              className="m-size"
              onClick={initialize}
            />
          </div>
        </section>
      ) : null}

      {status === 'ready' ? (
        <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Tag
              value={isPreview ? 'Local preview' : 'Backstage host'}
              severity={isPreview ? 'warning' : 'success'}
            />
            <p className="m-0 text-small text-text-secondary">
              {isPreview
                ? 'The Backstage SDK is not available here. Host metadata will appear after you upload the built package.'
                : 'The widget initialized successfully. Use this host context when calling Backstage APIs.'}
            </p>
          </div>

          <dl className="m-0 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-tiny font-medium text-text-muted">Portal</dt>
              <dd className="m-0 mt-1 text-default text-text">
                {hostValue(host, ['portalId', 'portal_id'])}
              </dd>
            </div>
            <div>
              <dt className="text-tiny font-medium text-text-muted">Space</dt>
              <dd className="m-0 mt-1 text-default text-text">
                {hostValue(host, ['spaceId', 'space_id'])}
              </dd>
            </div>
          </dl>

          <p className="m-0 text-tiny text-text-muted">
            Ask an AI assistant to replace this widget using the bundled
            sdk-extension-builder skill. Keep PrimeReact for controls and Tailwind
            tokens for layout.
          </p>
        </section>
      ) : null}
    </PageLayout>
  );
}
