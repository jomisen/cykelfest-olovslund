'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import SuccessState from './SuccessState'

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  address?: string
  partner_name?: string
  partner_email?: string
  partner_phone?: string
}

export default function RegistrationForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [isPair, setIsPair] = useState(true)
  const [partnerName, setPartnerName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerPhone, setPartnerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedName, setSubmittedName] = useState('')

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Namn är obligatoriskt'
        if (value.trim().length < 2) return 'Namn måste vara minst 2 tecken'
        return undefined
      case 'email':
        if (!value.trim()) return 'E-postadress är obligatorisk'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ange en giltig e-postadress'
        return undefined
      case 'phone':
        if (!value.trim()) return 'Telefonnummer är obligatoriskt'
        if (value.replace(/\s/g, '').length < 5) return 'Ange ett giltigt telefonnummer'
        return undefined
      case 'address':
        if (!value.trim()) return 'Adress är obligatorisk'
        return undefined
      case 'partner_name':
        if (isPair && !value.trim()) return 'Partnerns namn är obligatoriskt'
        return undefined
      case 'partner_email':
        if (isPair && !value.trim()) return 'Partnerns e-postadress är obligatorisk'
        if (isPair && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return 'Ange en giltig e-postadress'
        return undefined
      case 'partner_phone':
        if (isPair && !value.trim()) return 'Partnerns telefonnummer är obligatoriskt'
        if (isPair && value.replace(/\s/g, '').length < 5) return 'Ange ett giltigt telefonnummer'
        return undefined
      default:
        return undefined
    }
  }

  const handleBlur = (field: string, value: string) => {
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const clearError = (field: keyof FormErrors) =>
    setErrors(prev => ({ ...prev, [field]: undefined }))

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      phone: validateField('phone', phone),
      address: validateField('address', address),
      partner_name: isPair ? validateField('partner_name', partnerName) : undefined,
      partner_email: isPair ? validateField('partner_email', partnerEmail) : undefined,
      partner_phone: isPair ? validateField('partner_phone', partnerPhone) : undefined,
    }
    const filtered = Object.fromEntries(Object.entries(newErrors).filter(([, v]) => v !== undefined))
    setErrors(filtered)
    return Object.keys(filtered).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) { toast.error('Vänligen åtgärda felen i formuläret'); return }
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), phone: phone.trim(),
          address: address.trim(), is_pair: isPair,
          partner_name: isPair ? partnerName.trim() : undefined,
          partner_email: isPair ? partnerEmail.trim() : undefined,
          partner_phone: isPair ? partnerPhone.trim() : undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Något gick fel')
      setSubmittedName(name.trim())
      setIsSuccess(true)
      document.getElementById('anmalan')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Något gick fel. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) return <SuccessState name={submittedName} isPair={isPair} />

  const inputStyle = (hasError: boolean) => ({
    width: '100%', padding: '13px 16px',
    border: `2px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
    borderRadius: 12, fontSize: 16, outline: 'none',
    background: hasError ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)',
    color: '#f0ebff',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, background 0.2s',
    fontFamily: 'inherit',
  })

  const labelStyle = { display: 'block', fontSize: 14, fontWeight: 600, color: 'rgba(240,235,255,0.8)', marginBottom: 6 }
  const errorStyle = { color: '#f87171', fontSize: 13, marginTop: 5 }
  const fieldStyle = { display: 'flex', flexDirection: 'column' as const }

  const personCardStyle = () => ({
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 24,
    border: '1px solid rgba(255,255,255,0.13)',
    display: 'flex', flexDirection: 'column' as const, gap: 18,
  })

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Datum */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '8px 18px', alignSelf: 'flex-start' }}>
        <span style={{ fontSize: 14, color: 'rgba(240,235,255,0.9)', fontWeight: 700 }}>📅 12 juni · kl 18.00</span>
      </div>

      {/* Ensam / Par toggle */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ ...labelStyle, marginBottom: 10 }}>Anmälan</legend>
        <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)' }}>
          {[{ val: true, label: 'Par', emoji: '👫' }, { val: false, label: 'Ensam', emoji: '🙋' }].map(opt => (
            <button
              key={String(opt.val)} type="button"
              onClick={() => setIsPair(opt.val)}
              aria-pressed={isPair === opt.val}
              style={{
                flex: 1, padding: '13px 16px',
                background: isPair === opt.val ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'rgba(255,255,255,0.06)',
                color: isPair === opt.val ? 'white' : 'rgba(240,235,255,0.85)',
                fontWeight: 600, fontSize: 15, border: 'none',
                cursor: 'pointer', transition: 'all 0.2s',
                borderRight: opt.val === true ? '2px solid rgba(255,255,255,0.15)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Person-kort */}
      {isPair ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Person 1 */}
          <div style={personCardStyle()}>
            <p style={{ margin: 0, fontWeight: 700, color: 'rgba(240,235,255,0.6)', fontSize: 13, letterSpacing: '0.06em' }}>
              PERSON 1 – DU
            </p>
            <div style={fieldStyle}>
              <label htmlFor="name" style={labelStyle}>
                Namn <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" id="name" value={name}
                onChange={e => { setName(e.target.value); clearError('name') }}
                onBlur={e => handleBlur('name', e.target.value)}
                required aria-required="true"
                aria-invalid={errors.name ? 'true' : 'false'}
                style={inputStyle(!!errors.name)} placeholder="För- och efternamn"
              />
              {errors.name && <p style={errorStyle} role="alert">{errors.name}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div style={fieldStyle}>
                <label htmlFor="phone" style={labelStyle}>
                  Telefon <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="tel" id="phone" value={phone}
                  onChange={e => { setPhone(e.target.value); clearError('phone') }}
                  onBlur={e => handleBlur('phone', e.target.value)}
                  required aria-required="true"
                  aria-invalid={errors.phone ? 'true' : 'false'}
                  style={inputStyle(!!errors.phone)} placeholder="070-123 45 67"
                />
                {errors.phone && <p style={errorStyle} role="alert">{errors.phone}</p>}
              </div>
              <div style={fieldStyle}>
                <label htmlFor="email" style={labelStyle}>
                  E-post <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="email" id="email" value={email}
                  onChange={e => { setEmail(e.target.value); clearError('email') }}
                  onBlur={e => handleBlur('email', e.target.value)}
                  required aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  style={inputStyle(!!errors.email)} placeholder="din@email.se"
                />
                {errors.email && <p style={errorStyle} role="alert">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Person 2 */}
          <div style={personCardStyle()}>
            <p style={{ margin: 0, fontWeight: 700, color: 'rgba(240,235,255,0.6)', fontSize: 13, letterSpacing: '0.06em' }}>
              PERSON 2 – DIN PARTNER
            </p>
            <div style={fieldStyle}>
              <label htmlFor="partner_name" style={labelStyle}>
                Namn <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" id="partner_name" value={partnerName}
                onChange={e => { setPartnerName(e.target.value); clearError('partner_name') }}
                onBlur={e => handleBlur('partner_name', e.target.value)}
                required aria-required="true"
                aria-invalid={errors.partner_name ? 'true' : 'false'}
                style={inputStyle(!!errors.partner_name)} placeholder="För- och efternamn"
              />
              {errors.partner_name && <p style={errorStyle} role="alert">{errors.partner_name}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div style={fieldStyle}>
                <label htmlFor="partner_phone" style={labelStyle}>
                  Telefon <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="tel" id="partner_phone" value={partnerPhone}
                  onChange={e => { setPartnerPhone(e.target.value); clearError('partner_phone') }}
                  onBlur={e => handleBlur('partner_phone', e.target.value)}
                  required aria-required="true"
                  aria-invalid={errors.partner_phone ? 'true' : 'false'}
                  style={inputStyle(!!errors.partner_phone)} placeholder="070-123 45 67"
                />
                {errors.partner_phone && <p style={errorStyle} role="alert">{errors.partner_phone}</p>}
              </div>
              <div style={fieldStyle}>
                <label htmlFor="partner_email" style={labelStyle}>
                  E-post <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="email" id="partner_email" value={partnerEmail}
                  onChange={e => { setPartnerEmail(e.target.value); clearError('partner_email') }}
                  onBlur={e => handleBlur('partner_email', e.target.value)}
                  required aria-required="true"
                  aria-invalid={errors.partner_email ? 'true' : 'false'}
                  style={inputStyle(!!errors.partner_email)} placeholder="partner@email.se"
                />
                {errors.partner_email && <p style={errorStyle} role="alert">{errors.partner_email}</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Ensam */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={fieldStyle}>
            <label htmlFor="name" style={labelStyle}>
              Namn <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input type="text" id="name" value={name}
              onChange={e => { setName(e.target.value); clearError('name') }}
              onBlur={e => handleBlur('name', e.target.value)}
              required aria-required="true"
              style={inputStyle(!!errors.name)} placeholder="För- och efternamn"
            />
            {errors.name && <p style={errorStyle} role="alert">{errors.name}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={fieldStyle}>
              <label htmlFor="phone" style={labelStyle}>
                Telefon <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="tel" id="phone" value={phone}
                onChange={e => { setPhone(e.target.value); clearError('phone') }}
                onBlur={e => handleBlur('phone', e.target.value)}
                required aria-required="true"
                style={inputStyle(!!errors.phone)} placeholder="070-123 45 67"
              />
              {errors.phone && <p style={errorStyle} role="alert">{errors.phone}</p>}
            </div>
            <div style={fieldStyle}>
              <label htmlFor="email" style={labelStyle}>
                E-post <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="email" id="email" value={email}
                onChange={e => { setEmail(e.target.value); clearError('email') }}
                onBlur={e => handleBlur('email', e.target.value)}
                required aria-required="true"
                style={inputStyle(!!errors.email)} placeholder="din@email.se"
              />
              {errors.email && <p style={errorStyle} role="alert">{errors.email}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Adress – gemensam */}
      <div style={fieldStyle}>
        <label htmlFor="address" style={labelStyle}>
          {isPair ? 'Er adress i Olovslund' : 'Din adress i Olovslund'}{' '}
          <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input type="text" id="address" value={address}
          onChange={e => { setAddress(e.target.value); clearError('address') }}
          onBlur={e => handleBlur('address', e.target.value)}
          required aria-required="true"
          style={inputStyle(!!errors.address)} placeholder="Gatunamn 12"
        />
        {errors.address && <p style={errorStyle} role="alert">{errors.address}</p>}
      </div>

      {/* Kommentarer */}
      <div style={fieldStyle}>
        <label htmlFor="notes" style={labelStyle}>
          Kommentarer <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(valfritt)</span>
        </label>
        <textarea id="notes" value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          style={{ ...inputStyle(false), resize: 'none' }}
          placeholder="Allergier, önskemål eller annat vi bör veta"
        />
      </div>

      {/* Submit */}
      <button
        type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
        className="purple-gradient-btn"
        style={{
          padding: '16px 24px', borderRadius: 14, fontSize: 17,
          boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          marginTop: 4,
        }}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin" style={{ width: 20, height: 20 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Skickar…
          </>
        ) : isPair ? '🎉 Anmäl oss' : '🎉 Anmäl mig'}
      </button>
    </form>
  )
}
