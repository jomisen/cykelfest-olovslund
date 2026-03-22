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
}

export default function RegistrationForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [isPair, setIsPair] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
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
          return 'Ange en giltig e-postadress för partner'
        return undefined
      default:
        return undefined
    }
  }

  const handleBlur = (field: string, value: string) => {
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      phone: validateField('phone', phone),
      address: validateField('address', address),
      partner_name: isPair ? validateField('partner_name', partnerName) : undefined,
      partner_email: isPair ? validateField('partner_email', partnerEmail) : undefined,
    }
    const filtered = Object.fromEntries(Object.entries(newErrors).filter(([, v]) => v !== undefined))
    setErrors(filtered)
    return Object.keys(filtered).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) {
      toast.error('Vänligen åtgärda felen i formuläret')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          is_pair: isPair,
          partner_name: isPair ? partnerName.trim() : undefined,
          partner_email: isPair ? partnerEmail.trim() : undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Något gick fel')
      }

      setSubmittedName(name.trim())
      setIsSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Något gick fel. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return <SuccessState name={submittedName} />
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Namn */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Namn <span className="text-red-500" aria-label="obligatoriskt">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })) }}
          onBlur={e => handleBlur('name', e.target.value)}
          required
          aria-required="true"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-fest-purple focus:border-transparent transition-colors ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          placeholder="För- och efternamn"
        />
        {errors.name && <p id="name-error" className="text-red-600 text-sm mt-1.5" role="alert">{errors.name}</p>}
      </div>

      {/* E-post */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
          E-postadress <span className="text-red-500" aria-label="obligatoriskt">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })) }}
          onBlur={e => handleBlur('email', e.target.value)}
          required
          aria-required="true"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-fest-purple focus:border-transparent transition-colors ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          placeholder="din@email.se"
        />
        {errors.email && <p id="email-error" className="text-red-600 text-sm mt-1.5" role="alert">{errors.email}</p>}
      </div>

      {/* Telefon */}
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Telefonnummer <span className="text-red-500" aria-label="obligatoriskt">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: undefined })) }}
          onBlur={e => handleBlur('phone', e.target.value)}
          required
          aria-required="true"
          aria-invalid={errors.phone ? 'true' : 'false'}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-fest-purple focus:border-transparent transition-colors ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          placeholder="070-123 45 67"
        />
        {errors.phone && <p id="phone-error" className="text-red-600 text-sm mt-1.5" role="alert">{errors.phone}</p>}
      </div>

      {/* Adress */}
      <div>
        <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Din adress i Olovslund <span className="text-red-500" aria-label="obligatoriskt">*</span>
        </label>
        <input
          type="text"
          id="address"
          value={address}
          onChange={e => { setAddress(e.target.value); if (errors.address) setErrors(p => ({ ...p, address: undefined })) }}
          onBlur={e => handleBlur('address', e.target.value)}
          required
          aria-required="true"
          aria-invalid={errors.address ? 'true' : 'false'}
          aria-describedby={errors.address ? 'address-error' : undefined}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-fest-purple focus:border-transparent transition-colors ${errors.address ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          placeholder="Gatunamn 12"
        />
        {errors.address && <p id="address-error" className="text-red-600 text-sm mt-1.5" role="alert">{errors.address}</p>}
      </div>

      {/* Ensam / Par toggle */}
      <fieldset>
        <legend className="block text-sm font-semibold text-gray-700 mb-3">
          Anmälan <span className="text-red-500" aria-label="obligatoriskt">*</span>
        </legend>
        <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
          <button
            type="button"
            onClick={() => setIsPair(false)}
            aria-pressed={!isPair}
            className={`flex-1 py-3 font-semibold text-sm transition-all ${!isPair ? 'bg-fest-purple text-white shadow-inner' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Ensam
          </button>
          <button
            type="button"
            onClick={() => setIsPair(true)}
            aria-pressed={isPair}
            className={`flex-1 py-3 font-semibold text-sm transition-all border-l-2 border-gray-200 ${isPair ? 'bg-fest-purple text-white shadow-inner' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Par
          </button>
        </div>
      </fieldset>

      {/* Par-fält */}
      {isPair && (
        <div className="space-y-4 animate-fade-in-up bg-purple-50 rounded-2xl p-5 border border-purple-100">
          <p className="text-sm text-fest-purple font-medium">Partnerns uppgifter</p>
          <div>
            <label htmlFor="partner_name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Partnerns namn <span className="text-red-500" aria-label="obligatoriskt">*</span>
            </label>
            <input
              type="text"
              id="partner_name"
              value={partnerName}
              onChange={e => { setPartnerName(e.target.value); if (errors.partner_name) setErrors(p => ({ ...p, partner_name: undefined })) }}
              onBlur={e => handleBlur('partner_name', e.target.value)}
              required={isPair}
              aria-required={isPair ? 'true' : 'false'}
              aria-invalid={errors.partner_name ? 'true' : 'false'}
              aria-describedby={errors.partner_name ? 'partner-name-error' : undefined}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-fest-purple focus:border-transparent transition-colors ${errors.partner_name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
              placeholder="För- och efternamn"
            />
            {errors.partner_name && <p id="partner-name-error" className="text-red-600 text-sm mt-1.5" role="alert">{errors.partner_name}</p>}
          </div>
          <div>
            <label htmlFor="partner_email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Partnerns e-postadress <span className="text-red-500" aria-label="obligatoriskt">*</span>
            </label>
            <input
              type="email"
              id="partner_email"
              value={partnerEmail}
              onChange={e => { setPartnerEmail(e.target.value); if (errors.partner_email) setErrors(p => ({ ...p, partner_email: undefined })) }}
              onBlur={e => handleBlur('partner_email', e.target.value)}
              required={isPair}
              aria-required={isPair ? 'true' : 'false'}
              aria-invalid={errors.partner_email ? 'true' : 'false'}
              aria-describedby={errors.partner_email ? 'partner-email-error' : undefined}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-fest-purple focus:border-transparent transition-colors ${errors.partner_email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
              placeholder="partner@email.se"
            />
            {errors.partner_email && <p id="partner-email-error" className="text-red-600 text-sm mt-1.5" role="alert">{errors.partner_email}</p>}
          </div>
        </div>
      )}

      {/* Kommentarer */}
      <div>
        <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Kommentarer <span className="text-gray-400 font-normal">(valfritt)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fest-purple focus:border-transparent transition-colors resize-none"
          placeholder="Allergier, önskemål eller annat vi bör veta"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="w-full bg-gradient-to-r from-fest-purple to-fest-pink text-white font-bold py-4 px-6 rounded-2xl text-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-fest-purple/30 hover:shadow-fest-purple/50 hover:-translate-y-0.5"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Skickar…
          </span>
        ) : 'Anmäl mig'}
      </button>
    </form>
  )
}
