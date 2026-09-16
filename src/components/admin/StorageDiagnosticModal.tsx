import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  X,
  Database,
  Key,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

interface StorageDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServerConfigState {
  isConfigured: boolean;
  isOnline: boolean;
  hasServiceRoleKey: boolean;
  hasAnonKey: boolean;
  hasBucket?: boolean;
  supabaseUrl: string | null;
  storageMode: string;
  platform?: string;
}

export const StorageDiagnosticModal: React.FC<StorageDiagnosticModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [testingUpload, setTestingUpload] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    url?: string;
  } | null>(null);
  const [config, setConfig] = useState<ServerConfigState | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [language, setLanguage] = useState<'hinglish' | 'english'>('hinglish');

  const checkStatus = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        setConfig({
          isConfigured: false,
          isOnline: false,
          hasServiceRoleKey: false,
          hasAnonKey: false,
          supabaseUrl: null,
          storageMode: 'local',
        });
      }
    } catch {
      setConfig({
        isConfigured: false,
        isOnline: false,
        hasServiceRoleKey: false,
        hasAnonKey: false,
        supabaseUrl: null,
        storageMode: 'local',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const runTestUpload = async () => {
    setTestingUpload(true);
    setTestResult(null);
    try {
      // Create a 1x1 transparent PNG data URL to test the endpoint
      const testImage =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: testImage,
          name: 'diagnostic-test.png',
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && json.url) {
        setTestResult({
          success: true,
          message: 'Success! Supabase Storage upload is active and working properly.',
          url: json.url,
        });
        checkStatus();
      } else {
        setTestResult({
          success: false,
          message:
            json.message ||
            json.error ||
            `HTTP ${res.status}: Upload failed. Check your Netlify environment variables and bucket permissions.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Network request failed: ${err.message || 'Serverless function /api/upload-image unreachable.'}`,
      });
    } finally {
      setTestingUpload(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  const isSupabaseReady =
    Boolean(config?.supabaseUrl) &&
    Boolean(config?.hasAnonKey) &&
    Boolean(config?.hasServiceRoleKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Netlify Photo Storage Status & Guide
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isSupabaseReady
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isSupabaseReady ? 'Cloud Connected' : 'Local Fallback Mode'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Diagnose Netlify environment variables and Supabase bucket configuration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/60 flex items-center text-xs">
              <button
                onClick={() => setLanguage('hinglish')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  language === 'hinglish'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                हिंदी/Hinglish
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  language === 'english'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                English
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300">
          {/* Diagnostic Status Box */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <span className="font-semibold text-zinc-200 flex items-center gap-2 text-xs">
                <Database className="w-4 h-4 text-amber-400" />
                Live Netlify Serverless Function Check
              </span>
              <button
                onClick={checkStatus}
                disabled={loading}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 font-mono text-[11px]">SUPABASE_URL</span>
                {config?.supabaseUrl ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
                    <XCircle className="w-3.5 h-3.5" /> Missing
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</span>
                {config?.hasAnonKey ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
                    <XCircle className="w-3.5 h-3.5" /> Missing
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 font-mono text-[11px]">SUPABASE_SERVICE_ROLE_KEY</span>
                {config?.hasServiceRoleKey ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" /> Missing in Netlify
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 font-mono text-[11px]">Bucket: property-images</span>
                {config?.hasBucket ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
                    <HelpCircle className="w-3.5 h-3.5" /> Public Bucket Required
                  </span>
                )}
              </div>
            </div>

            {/* Test Upload Action */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-zinc-400">
                Current upload mode:{' '}
                <strong className={isSupabaseReady ? 'text-emerald-400' : 'text-amber-400'}>
                  {isSupabaseReady
                    ? 'Cloud Hosting (Supabase Storage)'
                    : 'Safe Local Mode (Compressed in browser, never blocks listing creation)'}
                </strong>
              </p>
              <button
                type="button"
                onClick={runTestUpload}
                disabled={testingUpload}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${testingUpload ? 'animate-spin' : ''}`} />
                <span>{testingUpload ? 'Testing Upload...' : 'Test Storage Upload'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.url && (
                      <p className="text-[11px] font-mono text-zinc-400 mt-1 break-all">
                        Uploaded URL: {testResult.url}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          {language === 'hinglish' ? (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  Error kyu aa raha tha?
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  Jab aapne project Netlify par deploy kiya, to Netlify ke pass aapke Supabase ke API Keys
                  aur Secret Keys nahi the. Isliye photos upload hone ke bajay fail ho rahi thi.
                  Humne ab app me <strong>Local Safe Mode</strong> add kar diya hai taaki aap photos bina kisi error ke add kar sakein, aur cloud par permanent store karne ke liye niche diye 3 steps follow karein:
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <span>Supabase Cloud Storage Enable karne ke 3 Asaan Steps:</span>
                </h4>

                {/* Step 1 */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[11px] flex items-center justify-center">
                      1
                    </span>
                    <span>Supabase me Storage Bucket banayein</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px] pl-6">
                    <li>
                      Apne <strong className="text-zinc-200">Supabase Dashboard</strong> me jayein.
                    </li>
                    <li>
                      Left sidebar se <strong className="text-zinc-200">Storage</strong> par click karein.
                    </li>
                    <li>
                      <strong className="text-zinc-200">New Bucket</strong> button par click karein.
                    </li>
                    <li>
                      Bucket name rakhein:{' '}
                      <code className="bg-zinc-800 text-amber-400 px-1.5 py-0.5 rounded font-mono">
                        property-images
                      </code>
                    </li>
                    <li>
                      <strong className="text-amber-400">Public bucket</strong> toggle ko <strong>ON</strong> karein (ye zaroori hai taaki photos WhatsApp & browsers me dikhein).
                    </li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[11px] flex items-center justify-center">
                      2
                    </span>
                    <span>Netlify Dashboard me Environment Variables dalein</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 pl-6">
                    Apne Netlify dashboard me jayein:{' '}
                    <strong className="text-zinc-200">Site configuration → Environment variables → Add a variable</strong>.
                    Niche di hui 3 keys add karein (values apne Supabase Project Settings → API se copy karein):
                  </p>

                  <div className="space-y-1.5 pl-6 pt-1">
                    {[
                      { key: 'VITE_SUPABASE_URL', desc: 'Supabase Project URL (https://xyz.supabase.co)' },
                      { key: 'VITE_SUPABASE_ANON_KEY', desc: 'Supabase Public anon key' },
                      { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Supabase service_role secret key' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between bg-zinc-900 p-2 rounded-lg border border-zinc-800"
                      >
                        <div>
                          <code className="text-amber-300 font-mono text-xs">{item.key}</code>
                          <p className="text-[10px] text-zinc-500">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.key, item.key)}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 transition-colors"
                        >
                          {copiedKey === item.key ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === item.key ? 'Copied' : 'Copy Key'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[11px] flex items-center justify-center">
                      3
                    </span>
                    <span>Netlify par Re-Deploy karein (Clear cache & deploy)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 pl-6 leading-relaxed">
                    Variables save karne ke baad Netlify ke <strong className="text-zinc-200">Deploys</strong> tab me jayein,{' '}
                    <strong className="text-zinc-200">Trigger deploy</strong> par click karein aur{' '}
                    <strong className="text-amber-400">"Clear cache and deploy site"</strong> select karein.
                    Deploy complete hote hi sabhi photos seedhe Supabase Cloud me upload hona shuru ho jayengi!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  Why did this upload error happen?
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  When you deployed the app to Netlify, Netlify's serverless functions did not have your
                  Supabase URL and API keys configured in Netlify's environment variables.
                  We have added <strong>Local Safe Mode</strong> so photo uploads no longer throw a blocking error,
                  and follow the steps below to connect permanent Supabase Cloud Storage.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-zinc-100 text-sm">
                  3 Steps to Enable Supabase Cloud Storage on Netlify:
                </h4>

                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[11px] flex items-center justify-center">
                      1
                    </span>
                    <span>Create 'property-images' Bucket in Supabase</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px] pl-6">
                    <li>Go to your Supabase Project Dashboard.</li>
                    <li>Click <strong>Storage</strong> in the left sidebar.</li>
                    <li>Click <strong>New Bucket</strong>.</li>
                    <li>Name it exactly: <code className="text-amber-400">property-images</code>.</li>
                    <li>Enable the <strong>Public bucket</strong> toggle so photos are viewable on WhatsApp & listings.</li>
                  </ul>
                </div>

                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[11px] flex items-center justify-center">
                      2
                    </span>
                    <span>Add Environment Variables in Netlify</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 pl-6">
                    In your Netlify Dashboard, navigate to <strong>Site configuration → Environment variables</strong>.
                    Add these 3 variables from Supabase Project Settings → API:
                  </p>

                  <div className="space-y-1.5 pl-6 pt-1">
                    {[
                      { key: 'VITE_SUPABASE_URL', desc: 'Supabase Project URL' },
                      { key: 'VITE_SUPABASE_ANON_KEY', desc: 'Public anon key' },
                      { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Service role secret key' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between bg-zinc-900 p-2 rounded-lg border border-zinc-800"
                      >
                        <div>
                          <code className="text-amber-300 font-mono text-xs">{item.key}</code>
                          <p className="text-[10px] text-zinc-500">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.key, item.key)}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 transition-colors"
                        >
                          {copiedKey === item.key ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === item.key ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-200">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[11px] flex items-center justify-center">
                      3
                    </span>
                    <span>Trigger a Clean Re-Deploy in Netlify</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 pl-6 leading-relaxed">
                    Go to the <strong>Deploys</strong> tab in Netlify, click <strong>Trigger deploy</strong>,
                    and select <strong>"Clear cache and deploy site"</strong> so the environment variables are active in your production build.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Open Supabase Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/10"
          >
            Got it, Continue
          </button>
        </div>
      </div>
    </div>
  );
};
