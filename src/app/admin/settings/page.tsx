'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Building2, Phone, Mail, MapPin, Clock, Bell, MessageSquare,
  Save, Loader2, CheckCircle2, Plus, X, Info, Globe, Palette,
  Upload, Image as ImageIcon, Hash, Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface SettingsData {
  // Identidade
  companyName:    string
  companySlogan:  string
  companyWebsite: string
  // Endereço
  companyAddress: string
  companyCity:    string
  companyState:   string
  companyZip:     string
  companyEin:     string
  // Contato
  supportPhone:   string
  supportEmail:   string
  whatsappNumber: string
  // Marca
  primaryColor:   string
  accentColor:    string
  logoUrl:        string
  faviconUrl:     string
  // Operação
  cities:             string[]
  startHour:          number
  endHour:            number
  minAdvanceHours:    number
  travelBlockMinutes: number
  // Notificações
  resendApiKey:    string
  resendFromEmail: string
  twilioSid:       string
  twilioToken:     string
  twilioPhone:     string
}

const DEFAULT: SettingsData = {
  companyName: '', companySlogan: '', companyWebsite: '',
  companyAddress: '', companyCity: '', companyState: '', companyZip: '', companyEin: '',
  supportPhone: '', supportEmail: '', whatsappNumber: '',
  primaryColor: '#0d9488', accentColor: '#f59e0b',
  logoUrl: '', faviconUrl: '',
  cities: [], startHour: 8, endHour: 18, minAdvanceHours: 24, travelBlockMinutes: 40,
  resendApiKey: '', resendFromEmail: '', twilioSid: '', twilioToken: '', twilioPhone: '',
}

export default function AdminSettingsPage() {
  const [data, setData]       = useState<SettingsData>(DEFAULT)
  const [newCity, setNewCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [uploadingLogo, setUploadingLogo]       = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const logoInputRef    = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((j: {
        success: boolean
        data?: {
          tenant?: { name?: string; slug?: string }
          settings?: Partial<SettingsData>
        }
      }) => {
        if (j.success && j.data) {
          const s = j.data.settings ?? {}
          setData({
            ...DEFAULT,
            companyName:        j.data.tenant?.name ?? '',
            companySlogan:      s.companySlogan  ?? '',
            companyWebsite:     s.companyWebsite ?? '',
            companyAddress:     s.companyAddress ?? '',
            companyCity:        s.companyCity    ?? '',
            companyState:       s.companyState   ?? '',
            companyZip:         s.companyZip     ?? '',
            companyEin:         s.companyEin     ?? '',
            supportPhone:       s.supportPhone   ?? '',
            supportEmail:       s.supportEmail   ?? '',
            whatsappNumber:     s.whatsappNumber ?? '',
            primaryColor:       s.primaryColor   ?? '#0d9488',
            accentColor:        s.accentColor    ?? '#f59e0b',
            logoUrl:            s.logoUrl        ?? '',
            faviconUrl:         s.faviconUrl     ?? '',
            cities:             s.cities ?? [],
            startHour:          s.startHour          ?? 8,
            endHour:            s.endHour            ?? 18,
            minAdvanceHours:    s.minAdvanceHours    ?? 24,
            travelBlockMinutes: s.travelBlockMinutes ?? 40,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const set = useCallback(<K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  function addCity() {
    const city = newCity.trim()
    if (!city || data.cities.includes(city)) return
    set('cities', [...data.cities, city])
    setNewCity('')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') {
    const file = e.target.files?.[0]
    if (!file) return

    const setter = type === 'logo' ? setUploadingLogo : setUploadingFavicon
    setter(true)
    try {
      const form = new FormData()
      form.append(type, file)
      form.append('type', type)

      const res  = await fetch('/api/admin/settings/logo', { method: 'POST', body: form })
      const json: { success: boolean; data?: { url: string }; error?: string } = await res.json()

      if (!json.success || !json.data?.url) {
        toast.error(json.error ?? 'Erro ao enviar imagem')
        return
      }
      set(type === 'logo' ? 'logoUrl' : 'faviconUrl', json.data.url)
      toast.success(type === 'logo' ? 'Logo atualizado!' : 'Favicon atualizado!')
    } catch {
      toast.error('Erro ao enviar imagem')
    } finally {
      setter(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    if (!data.companyName.trim()) { toast.error('Informe o nome da empresa'); return }
    if (data.cities.length === 0) { toast.error('Informe ao menos uma cidade atendida'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json: { success: boolean; error?: string } = await res.json()
      if (!json.success) { toast.error(json.error ?? 'Erro ao salvar'); return }
      setSaved(true)
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Configurações da empresa</h1>
          <p className="text-slate-500 text-sm mt-1">Personalize a identidade visual e os dados da sua empresa.</p>
        </div>
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      {/* ─── PREVIEW DA MARCA ─────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
        style={{ '--brand-primary': data.primaryColor, '--brand-accent': data.accentColor } as React.CSSProperties}
      >
        {/* Top bar preview */}
        <div className="h-2" style={{ background: data.primaryColor }} />
        <div className="bg-white px-6 py-5 flex items-center gap-4">
          {data.logoUrl ? (
            <Image src={data.logoUrl} alt="Logo" width={56} height={56} className="rounded-xl object-contain border border-slate-100" />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-2xl shrink-0"
              style={{ background: data.primaryColor }}
            >
              {data.companyName?.charAt(0)?.toUpperCase() || 'E'}
            </div>
          )}
          <div>
            <p className="font-extrabold text-slate-900 text-lg leading-tight">
              {data.companyName || 'Nome da empresa'}
            </p>
            {data.companySlogan && (
              <p className="text-sm mt-0.5" style={{ color: data.primaryColor }}>{data.companySlogan}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              {data.supportPhone && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" />{data.supportPhone}
                </span>
              )}
              {data.supportEmail && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" />{data.supportEmail}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto shrink-0">
            <span
              className="text-white text-xs font-bold px-4 py-2 rounded-full"
              style={{ background: data.accentColor }}
            >
              Agendar limpeza
            </span>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-2 text-xs text-slate-400 border-t border-slate-100">
          👆 Pré-visualização de como sua marca aparecerá
        </div>
      </div>

      {/* ─── LOGO E FAVICON ───────────────────────────────────────── */}
      <Section icon={<ImageIcon className="w-4 h-4" />} title="Logo e ícone da empresa">
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Logo */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700">Logo da empresa</Label>
            <div
              className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-all"
              onClick={() => logoInputRef.current?.click()}
            >
              {data.logoUrl ? (
                <div className="space-y-2">
                  <Image
                    src={data.logoUrl}
                    alt="Logo"
                    width={120}
                    height={60}
                    className="mx-auto object-contain max-h-16"
                  />
                  <p className="text-xs text-teal-600 font-medium">Clique para trocar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploadingLogo
                    ? <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
                    : <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                  }
                  <p className="text-sm font-medium text-slate-600">Clique para enviar o logo</p>
                  <p className="text-xs text-slate-400">PNG, JPG, SVG, WebP — máx 2 MB</p>
                </div>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => handleLogoUpload(e, 'logo')}
            />
            {data.logoUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl text-red-500 border-red-200 hover:bg-red-50 text-xs"
                onClick={() => set('logoUrl', '')}
              >
                <X className="w-3.5 h-3.5 mr-1" />Remover logo
              </Button>
            )}
          </div>

          {/* Favicon */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700">Favicon (ícone da aba)</Label>
            <div
              className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-all"
              onClick={() => faviconInputRef.current?.click()}
            >
              {data.faviconUrl ? (
                <div className="space-y-2">
                  <Image
                    src={data.faviconUrl}
                    alt="Favicon"
                    width={48}
                    height={48}
                    className="mx-auto object-contain"
                  />
                  <p className="text-xs text-teal-600 font-medium">Clique para trocar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploadingFavicon
                    ? <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
                    : <Hash className="w-8 h-8 text-slate-300 mx-auto" />
                  }
                  <p className="text-sm font-medium text-slate-600">Ícone da aba do navegador</p>
                  <p className="text-xs text-slate-400">PNG 32×32 ou ICO — máx 2 MB</p>
                </div>
              )}
            </div>
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/png,image/x-icon,image/vnd.microsoft.icon"
              className="hidden"
              onChange={(e) => handleLogoUpload(e, 'favicon')}
            />
          </div>
        </div>
      </Section>

      <Separator />

      {/* ─── CORES DA MARCA ───────────────────────────────────────── */}
      <Section icon={<Palette className="w-4 h-4" />} title="Cores da marca">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Cor principal</Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={data.primaryColor}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-1"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={data.primaryColor}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  placeholder="#0d9488"
                  className="rounded-xl border-slate-200 font-mono text-sm uppercase"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="h-8 rounded-xl w-full" style={{ background: data.primaryColor }} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Cor de destaque (botões, CTAs)</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={data.accentColor}
                onChange={(e) => set('accentColor', e.target.value)}
                className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-1"
              />
              <div className="flex-1">
                <Input
                  value={data.accentColor}
                  onChange={(e) => set('accentColor', e.target.value)}
                  placeholder="#f59e0b"
                  className="rounded-xl border-slate-200 font-mono text-sm uppercase"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="h-8 rounded-xl w-full" style={{ background: data.accentColor }} />
          </div>
        </div>

        <InfoBox>
          As cores serão aplicadas automaticamente em botões, cabeçalhos e destaques da plataforma.
        </InfoBox>
      </Section>

      <Separator />

      {/* ─── IDENTIDADE DA EMPRESA ────────────────────────────────── */}
      <Section icon={<Building2 className="w-4 h-4" />} title="Identidade da empresa">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome da empresa" required>
              <Input value={data.companyName} onChange={(e) => set('companyName', e.target.value)}
                placeholder="Ex: Clean Pro Services" className="rounded-xl border-slate-200 focus:border-teal-400" />
            </Field>
            <Field label="Slogan / tagline">
              <Input value={data.companySlogan} onChange={(e) => set('companySlogan', e.target.value)}
                placeholder="Ex: Sua casa brilhando em horas" className="rounded-xl border-slate-200 focus:border-teal-400" />
            </Field>
          </div>

          <Field label="Website" icon={<Globe className="w-3.5 h-3.5 text-slate-400" />}>
            <Input value={data.companyWebsite} onChange={(e) => set('companyWebsite', e.target.value)}
              placeholder="https://suaempresa.com" type="url"
              className="rounded-xl border-slate-200 focus:border-teal-400" />
          </Field>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Field label="Endereço">
                <Input value={data.companyAddress} onChange={(e) => set('companyAddress', e.target.value)}
                  placeholder="1234 Main St" className="rounded-xl border-slate-200 focus:border-teal-400" />
              </Field>
            </div>
            <Field label="CEP / ZIP">
              <Input value={data.companyZip} onChange={(e) => set('companyZip', e.target.value)}
                placeholder="33901" className="rounded-xl border-slate-200 focus:border-teal-400" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cidade">
              <Input value={data.companyCity} onChange={(e) => set('companyCity', e.target.value)}
                placeholder="Fort Myers" className="rounded-xl border-slate-200 focus:border-teal-400" />
            </Field>
            <Field label="Estado">
              <Input value={data.companyState} onChange={(e) => set('companyState', e.target.value)}
                placeholder="FL" className="rounded-xl border-slate-200 focus:border-teal-400" />
            </Field>
          </div>

          <Field label="EIN / Tax ID (opcional)" icon={<Hash className="w-3.5 h-3.5 text-slate-400" />}>
            <Input value={data.companyEin} onChange={(e) => set('companyEin', e.target.value)}
              placeholder="12-3456789" className="rounded-xl border-slate-200 focus:border-teal-400 w-64" />
            <p className="text-xs text-slate-400 mt-1">Usado em notas fiscais e recibos</p>
          </Field>
        </div>
      </Section>

      <Separator />

      {/* ─── CONTATO ──────────────────────────────────────────────── */}
      <Section icon={<Phone className="w-4 h-4" />} title="Canais de contato">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Telefone" icon={<Phone className="w-3.5 h-3.5 text-slate-400" />}>
            <Input value={data.supportPhone} onChange={(e) => set('supportPhone', e.target.value)}
              placeholder="+1 (239) 555-0100" className="rounded-xl border-slate-200 focus:border-teal-400" />
            <p className="text-xs text-slate-400 mt-1">Recebe SMS de agendamentos</p>
          </Field>

          <Field label="Email" icon={<Mail className="w-3.5 h-3.5 text-slate-400" />}>
            <Input type="email" value={data.supportEmail} onChange={(e) => set('supportEmail', e.target.value)}
              placeholder="contato@empresa.com" className="rounded-xl border-slate-200 focus:border-teal-400" />
            <p className="text-xs text-slate-400 mt-1">Recebe emails de agendamentos</p>
          </Field>

          <Field label="WhatsApp" icon={<Smartphone className="w-3.5 h-3.5 text-slate-400" />}>
            <Input value={data.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)}
              placeholder="+1 (239) 555-0100" className="rounded-xl border-slate-200 focus:border-teal-400" />
            <p className="text-xs text-slate-400 mt-1">Exibido para clientes no app</p>
          </Field>
        </div>
      </Section>

      <Separator />

      {/* ─── CIDADES ATENDIDAS ────────────────────────────────────── */}
      <Section icon={<MapPin className="w-4 h-4" />} title="Cidades atendidas">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={newCity} onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())}
              placeholder="Digite a cidade e pressione Enter..."
              className="rounded-xl border-slate-200 focus:border-teal-400" />
            <Button type="button" onClick={addCity} variant="outline"
              className="rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50 shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {data.cities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.cities.map((city) => (
                <span key={city} className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-sm px-3 py-1.5 rounded-full font-medium">
                  <MapPin className="w-3 h-3" />{city}
                  <button onClick={() => set('cities', data.cities.filter((c) => c !== city))} className="hover:text-red-500 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Separator />

      {/* ─── HORÁRIOS ─────────────────────────────────────────────── */}
      <Section icon={<Clock className="w-4 h-4" />} title="Horários de funcionamento">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Início do expediente">
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={23} value={data.startHour}
                onChange={(e) => set('startHour', Number(e.target.value))}
                className="rounded-xl border-slate-200 focus:border-teal-400 w-20" />
              <span className="text-slate-500 text-sm">h (Eastern Time)</span>
            </div>
          </Field>
          <Field label="Fim do expediente">
            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={24} value={data.endHour}
                onChange={(e) => set('endHour', Number(e.target.value))}
                className="rounded-xl border-slate-200 focus:border-teal-400 w-20" />
              <span className="text-slate-500 text-sm">h (Eastern Time)</span>
            </div>
          </Field>
          <Field label="Antecedência mínima">
            <div className="flex items-center gap-2">
              <Input type="number" min={1} value={data.minAdvanceHours}
                onChange={(e) => set('minAdvanceHours', Number(e.target.value))}
                className="rounded-xl border-slate-200 focus:border-teal-400 w-20" />
              <span className="text-slate-500 text-sm">horas antes</span>
            </div>
          </Field>
          <Field label="Bloqueio de deslocamento">
            <div className="flex items-center gap-2">
              <Input type="number" min={0} value={data.travelBlockMinutes}
                onChange={(e) => set('travelBlockMinutes', Number(e.target.value))}
                className="rounded-xl border-slate-200 focus:border-teal-400 w-20" />
              <span className="text-slate-500 text-sm">min após serviço</span>
            </div>
          </Field>
        </div>
      </Section>

      <Separator />

      {/* ─── EMAIL ────────────────────────────────────────────────── */}
      <Section icon={<Bell className="w-4 h-4" />} title="Notificações por email" badge="Resend">
        <InfoBox>
          Crie conta gratuita em <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-teal-600 underline font-medium">resend.com</a> → obtenha sua API Key → verifique o domínio do email.
        </InfoBox>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="API Key">
            <Input type="password" value={data.resendApiKey} onChange={(e) => set('resendApiKey', e.target.value)}
              placeholder="re_xxxxxxxxxxxxxxxxxxxx"
              className="rounded-xl border-slate-200 focus:border-teal-400 font-mono text-sm" />
          </Field>
          <Field label="Email remetente">
            <Input type="email" value={data.resendFromEmail} onChange={(e) => set('resendFromEmail', e.target.value)}
              placeholder="noreply@suaempresa.com"
              className="rounded-xl border-slate-200 focus:border-teal-400" />
          </Field>
        </div>
      </Section>

      <Separator />

      {/* ─── SMS ──────────────────────────────────────────────────── */}
      <Section icon={<MessageSquare className="w-4 h-4" />} title="Notificações por SMS" badge="Twilio">
        <InfoBox>
          Crie conta em <a href="https://twilio.com" target="_blank" rel="noreferrer" className="text-teal-600 underline font-medium">twilio.com</a> → copie Account SID, Auth Token e compre um número de telefone.
        </InfoBox>
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <Field label="Account SID">
            <Input type="password" value={data.twilioSid} onChange={(e) => set('twilioSid', e.target.value)}
              placeholder="ACxxxxxxxx..."
              className="rounded-xl border-slate-200 focus:border-teal-400 font-mono text-sm" />
          </Field>
          <Field label="Auth Token">
            <Input type="password" value={data.twilioToken} onChange={(e) => set('twilioToken', e.target.value)}
              placeholder="••••••••••••••••"
              className="rounded-xl border-slate-200 focus:border-teal-400 font-mono text-sm" />
          </Field>
          <Field label="Número Twilio">
            <Input value={data.twilioPhone} onChange={(e) => set('twilioPhone', e.target.value)}
              placeholder="+12345678901"
              className="rounded-xl border-slate-200 focus:border-teal-400" />
          </Field>
        </div>
      </Section>

      {/* Save final */}
      <div className="flex justify-end pt-2">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} large />
      </div>
    </div>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function SaveButton({ saving, saved, onClick, large }: {
  saving: boolean; saved: boolean; onClick: () => void; large?: boolean
}) {
  return (
    <Button
      onClick={onClick}
      disabled={saving}
      className={`bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold ${large ? 'px-10 h-12 text-base' : 'px-6 h-10'}`}
    >
      {saving
        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</>
        : saved
        ? <><CheckCircle2 className="w-4 h-4 mr-2" />Salvo!</>
        : <><Save className="w-4 h-4 mr-2" />Salvar configurações</>
      }
    </Button>
  )
}

function Section({ icon, title, badge, children }: {
  icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">{icon}</div>
        <h2 className="font-bold text-slate-900">{title}</h2>
        {badge && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, required, icon, children }: {
  label: string; required?: boolean; icon?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
        {icon}{label}{required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
      <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 leading-relaxed">{children}</p>
    </div>
  )
}
