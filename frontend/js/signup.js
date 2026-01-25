document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupForm')
    const fullNameInput = document.getElementById('full_name')
    const emailInput = document.getElementById('email')
    const phoneInput = document.getElementById('phone')
    const passwordInput = document.getElementById('password')
    const confirmPasswordInput = document.getElementById('confirmPassword')
    const togglePasswordBtn = document.getElementById('togglePassword')
    const eyeIcon = document.getElementById('eyeIcon')
    const errorBox = document.getElementById('errorBox')
    const submitBtn = document.getElementById('submitBtn')

    let showPassword = false

    togglePasswordBtn.addEventListener('click', function () {
        showPassword = !showPassword
        passwordInput.type = showPassword ? 'text' : 'password'
        confirmPasswordInput.type = showPassword ? 'text' : 'password'

        if (showPassword) {
            eyeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>'
        } else {
            eyeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>'
        }
    })

    function showError(message) {
        errorBox.textContent = message
        errorBox.classList.remove('hidden')
    }

    function hideError() {
        errorBox.classList.add('hidden')
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault()
        hideError()

        const fullName = fullNameInput.value.trim()
        const email = emailInput.value.trim()
        const phone = phoneInput.value.trim()
        const password = passwordInput.value
        const confirmPassword = confirmPasswordInput.value

        if (!fullName || !email || !password) {
            showError('Please fill in all required fields')
            return
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters')
            return
        }

        Loading.showButton(submitBtn)

        try {
            const response = await authService.signup({
                full_name: fullName,
                email: email,
                phone: phone,
                password: password,
                role: 'customer'
            })

            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            Toast.success('Account created successfully!')

            setTimeout(() => {
                window.location.href = 'customer-floors.html'
            }, 500)
        } catch (err) {
            showError(err.message || 'Signup failed')
            Toast.error('Signup failed')
            Loading.hideButton(submitBtn)
        }
    })
})
