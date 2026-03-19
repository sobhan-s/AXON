import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Loader2,
  Star,
  Eye,
  Download,
  FileText,
  ImageIcon,
  Film,
  Search,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  GitBranch,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ASSET_ENDPOINTS } from '@/lib/api-endpints';
import type { TypeFilter } from '@/constants/docsType';
import { AssetTypeBadge } from '@/components/badge';
import { formatBytes } from '@/constants/chunkSize';
import type {
  FinalizedAsset,
  AssetVariant,
  AssetVersion,
  VariantsData,
} from '@/interfaces/FInalizedAsset';
import { VARIANT_COLORS, VARIANT_LABELS } from '@/constants/statusType';
const api = axios.create({ withCredentials: true });

function AssetTypeIcon({
  mimeType,
  className = 'h-4 w-4',
}: {
  mimeType: string;
  className?: string;
}) {
  if (mimeType?.startsWith('image/'))
    return <ImageIcon className={className} />;
  if (mimeType?.startsWith('video/')) return <Film className={className} />;
  return <FileText className={className} />;
}

function VariantsPanel({
  assetId,
  mimeType,
}: {
  assetId: string;
  mimeType: string;
}) {
  const [data, setData] = useState<VariantsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const isImage = mimeType?.startsWith('image/');
  const isVideo = mimeType?.startsWith('video/');
  const availableVariants = isImage
    ? ['thumbnail', 'compressed', 'optimized']
    : isVideo
      ? ['thumbnail', '480p', '720p', '1080p']
      : [];
  const fetchVariants = useCallback(async () => {
    try {
      const { data: res } = await api.get(
        ASSET_ENDPOINTS.GET_VARIANTS(assetId),
      );
      setData(res.data ?? res);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [assetId]);
  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);
  useEffect(() => {
    if (data?.processingStatus !== 'processing') return;
    const interval = setInterval(fetchVariants, 3000);
    return () => clearInterval(interval);
  }, [data?.processingStatus, fetchVariants]);
  const requestVariants = async () => {
    if (!selected.length) return;
    setRequesting(true);
    try {
      await api.post(ASSET_ENDPOINTS.REQUEST_VARIANTS(assetId), {
        variants: selected,
      });
      toast.success(`Generating: ${selected.join(', ')}`);
      setSelected([]);
      fetchVariants();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to request variants');
    } finally {
      setRequesting(false);
    }
  };
  const getVariantUrl = async (variantId: string) => {
    console.log('variantasd oadsoifj asdoijfoaisdjf', variantId);

    try {
      const { data } = await api.get(
        ASSET_ENDPOINTS.GET_VARIANT_DOWNLOAD_URL(variantId),
      );
      return data.data?.url ?? data.url;
    } catch {
      return null;
    }
  };
  const downloadVariant = async (variant: AssetVariant) => {
    const url = await getVariantUrl(variant._id);
    console.log('----------', url);
    if (!url) return toast.error('Could not get download URL');
    window.open(url, '_blank');
    // const downloadeableUrl = new URL(url);
    // const filename = downloadeableUrl.pathname.split('/').pop();
    // return <a href={url} download={filename}></a>;
  };
  if (!availableVariants.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Variants not available for documents.
      </p>
    );
  }
  const existingTypes = new Set(data?.variants.map((v) => v.variantType) ?? []);
  const notYetGenerated = availableVariants.filter(
    (v: any) => !existingTypes.has(v),
  );
  return (
    <div className="space-y-4">
      {data?.processingStatus === 'processing' && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Processing variants...
        </div>
      )}
      {data?.processingStatus === 'failed' && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-3.5 w-3.5" />
          Processing failed: {data.processingError ?? 'Unknown error'}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : data?.variants.length ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Generated
          </p>
          <div className="divide-y rounded-lg border overflow-hidden">
            {data.variants.map((variant) => (
              <div
                key={variant._id}
                className="flex items-center justify-between px-3 py-2.5 bg-background hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${VARIANT_COLORS[variant.variantType] ?? 'bg-muted text-muted-foreground'}`}
                  >
                    {VARIANT_LABELS[variant.variantType] ?? variant.variantType}
                  </span>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    {variant.fileSize && (
                      <span>{formatBytes(variant.fileSize)}</span>
                    )}
                    {variant.width && variant.height && (
                      <span>
                        {variant.width}x{variant.height}
                      </span>
                    )}
                    {variant.duration && (
                      <span>{Math.round(variant.duration)}s</span>
                    )}
                    {variant.processingTime && (
                      <span className="text-muted-foreground/60">
                        {(variant.processingTime / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => downloadVariant(variant)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No variants generated yet.
        </p>
      )}

      {notYetGenerated.length > 0 &&
        data?.processingStatus !== 'processing' && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Generate New
            </p>
            <div className="flex flex-wrap gap-2">
              {notYetGenerated.map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setSelected((prev) =>
                      prev.includes(v)
                        ? prev.filter((x) => x !== v)
                        : [...prev, v],
                    )
                  }
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    selected.includes(v)
                      ? 'bg-foreground text-background border-transparent'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {VARIANT_LABELS[v]}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              disabled={!selected.length || requesting}
              onClick={requestVariants}
              className="w-full"
            >
              {requesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Cpu className="h-3.5 w-3.5 mr-1.5" />
              )}
              Generate{' '}
              {selected.length > 0 ? `(${selected.join(', ')})` : 'Selected'}
            </Button>
          </div>
        )}
    </div>
  );
}

function VersionsPanel({
  assetId,
  currentVersion,
}: {
  assetId: string;
  currentVersion: number;
}) {
  const [versions, setVersions] = useState<AssetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get(ASSET_ENDPOINTS.GET_VERSIONS(assetId))
      .then(({ data }) => setVersions(data?.data ?? data ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [assetId]);
  if (loading)
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  if (!versions.length)
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No version history.
      </p>
    );
  return (
    <div className="divide-y rounded-lg border overflow-hidden">
      {versions.map((v) => (
        <div
          key={v._id}
          className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${v.version === currentVersion ? 'bg-muted/50' : 'bg-background hover:bg-muted/30'}`}
        >
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${v.version === currentVersion ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-muted text-muted-foreground'}`}
          >
            v{v.version}
          </span>
          {v.version === currentVersion && (
            <span className="text-[10px] font-semibold text-purple-600 flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-purple-500" /> Current
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate text-muted-foreground">
              {v.originalName}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span>{formatBytes(v.fileSize)}</span>
            <span>
              {new Date(v.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {v.userName && (
              <span className="flex items-center gap-0.5">
                <User className="h-3 w-3" />
                {v.userName}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FinalizedAssetsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<FinalizedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [previewAsset, setPreviewAsset] = useState<FinalizedAsset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const fetchAssets = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await api.get(
        `${ASSET_ENDPOINTS.GET_BY_PROJECT(Number(projectId))}?isFinal=true`,
      );
      const list: FinalizedAsset[] = data?.data ?? data ?? [];
      setAssets(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load finalized assets');
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);
  const openPreview = async (asset: FinalizedAsset) => {
    setPreviewAsset(asset);
    setPreviewUrl(null);
    setPreviewLoading(true);
    setActiveTab('preview');
    api.post(ASSET_ENDPOINTS.TRACK_VIEW(asset._id)).catch(() => null);
    try {
      const { data } = await api.get(
        ASSET_ENDPOINTS.GET_DOWNLOAD_URL(asset._id),
      );
      setPreviewUrl(data?.data?.url ?? data?.url ?? null);
    } catch {
      toast.error('Could not load preview');
    } finally {
      setPreviewLoading(false);
    }
  };
  const isImage = (a: FinalizedAsset) => a.mimeType?.startsWith('image/');
  const isVideo = (a: FinalizedAsset) => a.mimeType?.startsWith('video/');
  const isDocument = (a: FinalizedAsset) => !isImage(a) && !isVideo(a);
  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.originalName.toLowerCase().includes(q) ||
      (a.userName ?? '').toLowerCase().includes(q);
    const matchType =
      typeFilter === 'ALL'
        ? true
        : typeFilter === 'image'
          ? isImage(a)
          : typeFilter === 'video'
            ? isVideo(a)
            : isDocument(a);
    return matchSearch && matchType;
  });
  const counts: Record<TypeFilter, number> = {
    ALL: assets.length,
    image: assets.filter(isImage).length,
    video: assets.filter(isVideo).length,
    document: assets.filter(isDocument).length,
  };
  const totalSize = assets.reduce((s, a) => s + (a.fileSize ?? a.size ?? 0), 0);
  const totalViews = assets.reduce((s, a) => s + (a.viewCount ?? 0), 0);
  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-500 fill-purple-400" />
            <h1 className="text-2xl font-bold tracking-tight">
              Finalized Assets
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {loading
              ? 'Loading...'
              : `${assets.length} finalized file${assets.length !== 1 ? 's' : ''} · ${formatBytes(totalSize)} · ${totalViews} views`}
          </p>
        </div>
      </div>

      {!loading && (
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'ALL' as TypeFilter, label: 'All', icon: null },
            {
              key: 'image' as TypeFilter,
              label: 'Images',
              icon: <ImageIcon className="h-3 w-3" />,
            },
            {
              key: 'video' as TypeFilter,
              label: 'Videos',
              icon: <Film className="h-3 w-3" />,
            },
            {
              key: 'document' as TypeFilter,
              label: 'Documents',
              icon: <FileText className="h-3 w-3" />,
            },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                typeFilter === key
                  ? 'bg-foreground text-background border-transparent'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {icon}
              {label} ({counts[key]})
            </button>
          ))}
        </div>
      )}

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or uploader..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search finalized assets"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Separator />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Star className="h-12 w-12 text-muted-foreground/20" />
          <p className="text-muted-foreground text-sm">
            {search || typeFilter !== 'ALL'
              ? 'No finalized assets match your filters.'
              : 'No finalized assets yet. Open a task and mark an asset as final.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden shadow-sm">
          <Table aria-label="Finalized assets">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12" />
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  File Name
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Version
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Size
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Uploaded By
                  </span>
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date
                  </span>
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Views
                  </span>
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Task
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((asset) => (
                <TableRow
                  key={asset._id}
                  className="group cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => openPreview(asset)}
                  aria-label={`Preview ${asset.originalName}`}
                >
                  <TableCell>
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <AssetTypeIcon
                        mimeType={asset.mimeType}
                        className="h-4 w-4 text-muted-foreground"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-xs group-hover:text-primary transition-colors">
                        {asset.originalName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <AssetTypeBadge mimeType={asset.mimeType} />
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          <Star className="h-2.5 w-2.5 fill-purple-500" /> Final
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      v{asset.version ?? 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(asset.fileSize ?? asset.size ?? 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {asset.userName ?? ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(asset.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {asset.viewCount ?? 0}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {asset.taskId ? (
                      <button
                        className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        aria-label={`Open task TASK-${asset.taskId}`}
                        onClick={() =>
                          navigate(
                            `/projects/${projectId}/tasks/${asset.taskId}`,
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        TASK-{asset.taskId}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        . . .
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openPreview(asset)}
                      aria-label={`Preview ${asset.originalName}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {assets.length} finalized asset
              {assets.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {totalViews} total views
              </span>
              <span>{formatBytes(totalSize)} total</span>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={!!previewAsset}
        onOpenChange={(o) => {
          if (!o) {
            setPreviewAsset(null);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 min-w-0">
              {previewAsset && (
                <AssetTypeIcon
                  mimeType={previewAsset.mimeType}
                  className="h-4 w-4 shrink-0"
                />
              )}
              <span className="truncate">{previewAsset?.originalName}</span>
              <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                <Star className="h-3 w-3 fill-purple-500" /> Final
              </span>
              {previewAsset?.version && (
                <span className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                  v{previewAsset.version}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Preview, variants, and version history for{' '}
              {previewAsset?.originalName}
            </DialogDescription>
          </DialogHeader>
          {previewAsset && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </TabsTrigger>
                <TabsTrigger
                  value="variants"
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Cpu className="h-3.5 w-3.5" /> Variants
                </TabsTrigger>
                <TabsTrigger
                  value="versions"
                  className="flex items-center gap-1.5 text-xs"
                >
                  <GitBranch className="h-3.5 w-3.5" /> Versions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-3">
                <div className="rounded-lg overflow-hidden border bg-muted/20 flex items-center justify-center min-h-56">
                  {previewLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : previewUrl ? (
                    <>
                      {previewAsset.mimeType?.startsWith('image/') && (
                        <img
                          src={previewUrl}
                          alt={previewAsset.originalName}
                          className="max-w-full max-h-[440px] object-contain"
                        />
                      )}
                      {previewAsset.mimeType?.startsWith('video/') && (
                        <video
                          src={previewUrl}
                          controls
                          autoPlay
                          muted
                          className="max-w-full max-h-[440px]"
                        />
                      )}
                      {previewAsset.mimeType === 'application/pdf' && (
                        <iframe
                          src={previewUrl}
                          title={previewAsset.originalName}
                          className="w-full h-[440px]"
                        />
                      )}
                      {!previewAsset.mimeType?.startsWith('image/') &&
                        !previewAsset.mimeType?.startsWith('video/') &&
                        previewAsset.mimeType !== 'application/pdf' && (
                          <div className="flex flex-col items-center gap-3 py-12">
                            <FileText className="h-12 w-12 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">
                              No preview for this file type.
                            </p>
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" />{' '}
                                Download to view
                              </a>
                            </Button>
                          </div>
                        )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Could not load asset.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-3 mt-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />{' '}
                    Approved
                  </span>
                  <span>·</span>
                  <span>
                    {formatBytes(
                      previewAsset.fileSize ?? previewAsset.size ?? 0,
                    )}
                  </span>
                  <span>·</span>
                  <span>{previewAsset.mimeType}</span>
                  <span>·</span>
                  <span>
                    {new Date(previewAsset.createdAt).toLocaleDateString()}
                  </span>
                  {previewAsset.userName && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {previewAsset?.userName}
                      </span>
                    </>
                  )}
                  {(previewAsset.viewCount ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {previewAsset.viewCount} views
                      </span>
                    </>
                  )}
                  {previewAsset.taskId && (
                    <button
                      className="ml-auto flex items-center gap-1 text-primary hover:underline text-xs"
                      onClick={() => {
                        setPreviewAsset(null);
                        navigate(
                          `/projects/${projectId}/tasks/${previewAsset.taskId}`,
                        );
                      }}
                    >
                      <ExternalLink className="h-3 w-3" /> Open Task
                    </button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="variants" className="mt-3">
                <VariantsPanel
                  assetId={previewAsset._id}
                  mimeType={previewAsset.mimeType}
                />
              </TabsContent>

              <TabsContent value="versions" className="mt-3">
                <VersionsPanel
                  assetId={previewAsset._id}
                  currentVersion={previewAsset.version ?? 1}
                />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            {previewUrl && activeTab === 'preview' && (
              <Button variant="outline" size="sm" asChild>
                <a href={previewUrl} target="_blank" rel="noreferrer" download>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
