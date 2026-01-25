function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

function isValidPhone(phone) {
    const re = /^[6-9]\d{9}$/
    return re.test(phone?.replace(/\D/g, ''))
}

function isValidPassword(password) {
    return password && password.length >= 6
}

function isRequired(value) {
    if (typeof value === 'string') return value.trim().length > 0
    if (typeof value === 'number') return !isNaN(value)
    return value != null
}

function hasMinLength(value, min) {
    return value && value.length >= min
}

function hasMaxLength(value, max) {
    return !value || value.length <= max
}

function isPositiveNumber(value) {
    const num = parseFloat(value)
    return !isNaN(num) && num > 0
}

function isNonNegativeNumber(value) {
    const num = parseFloat(value)
    return !isNaN(num) && num >= 0
}

function isInteger(value) {
    const num = parseFloat(value)
    return !isNaN(num) && Number.isInteger(num)
}

function validateForm(data, rules) {
    const errors = {}

    Object.keys(rules).forEach(field => {
        const value = data[field]
        const fieldRules = rules[field]

        if (fieldRules.required && !isRequired(value)) {
            errors[field] = fieldRules.requiredMessage || 'This field is required'
            return
        }

        if (value) {
            if (fieldRules.email && !isValidEmail(value)) {
                errors[field] = 'Please enter a valid email'
            }

            if (fieldRules.phone && !isValidPhone(value)) {
                errors[field] = 'Please enter a valid phone number'
            }

            if (fieldRules.minLength && !hasMinLength(value, fieldRules.minLength)) {
                errors[field] = `Minimum ${fieldRules.minLength} characters required`
            }

            if (fieldRules.maxLength && !hasMaxLength(value, fieldRules.maxLength)) {
                errors[field] = `Maximum ${fieldRules.maxLength} characters allowed`
            }

            if (fieldRules.positive && !isPositiveNumber(value)) {
                errors[field] = 'Must be a positive number'
            }

            if (fieldRules.custom && typeof fieldRules.custom === 'function') {
                const customError = fieldRules.custom(value, data)
                if (customError) {
                    errors[field] = customError
                }
            }
        }
    })

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}
