export interface ValidationResult {
  valid: boolean
  missing: string[]
  message: string
}

/**
 * Validates required fields in a form element before submission.
 * Highlights invalid fields with .field-invalid and sets up automatic removal on user edit.
 */
export function validateRequiredFields(form: HTMLFormElement): ValidationResult {
  const elements = Array.from(form.elements) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]
  const missing: string[] = []
  let firstInvalid: HTMLElement | null = null

  // Clear previous field-invalid class
  elements.forEach(el => {
    if (el.classList) {
      el.classList.remove('field-invalid')
    }
  })

  for (const el of elements) {
    if (el.disabled || !el.name) continue

    if (el.required) {
      let isFilled = false
      if (el.type === 'checkbox' || el.type === 'radio') {
        isFilled = (el as HTMLInputElement).checked
      } else if (el.type === 'file') {
        isFilled = !!(el as HTMLInputElement).files && (el as HTMLInputElement).files!.length > 0
      } else {
        isFilled = !!(el.value && el.value.trim().length > 0)
      }

      if (!isFilled) {
        el.classList.add('field-invalid')
        if (!firstInvalid) firstInvalid = el

        // Find human-readable label
        let labelText = ''
        const parentLabel = el.closest('label')
        if (parentLabel) {
          // Clone and strip helper tags to get just the field title
          const clone = parentLabel.cloneNode(true) as HTMLElement
          clone.querySelectorAll('em, small, span, input, select, textarea, button, svg').forEach(n => n.remove())
          labelText = clone.textContent?.replace(/[:*]/g, '').trim() || ''
        }
        if (!labelText) {
          labelText = el.getAttribute('aria-label') || ('placeholder' in el ? (el as HTMLInputElement).placeholder : '') || el.name
        }
        if (labelText && !missing.includes(labelText)) {
          missing.push(labelText)
        }
      }
    }
  }

  // Remove invalid style when user interacts
  const handleInteraction = (e: Event) => {
    const target = e.target as HTMLElement
    if (target?.classList?.contains('field-invalid')) {
      target.classList.remove('field-invalid')
    }
  }
  form.addEventListener('input', handleInteraction, { once: true })
  form.addEventListener('change', handleInteraction, { once: true })

  if (firstInvalid) {
    try {
      firstInvalid.focus()
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch {
      // ignore
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      message: `Preencha os campos obrigatórios: ${missing.join(', ')}.`
    }
  }

  return { valid: true, missing: [], message: '' }
}
