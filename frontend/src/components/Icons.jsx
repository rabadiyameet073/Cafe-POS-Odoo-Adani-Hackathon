/**
 * Shared SVG Icon library — replaces all emoji usage across the app.
 * Usage: <Icon name="chair" className="w-5 h-5" />
 */

const paths = {
    // ── Navigation & Layout ──
    chair: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 21v-4M19 21v-4M4 17h16M6 13V7a2 2 0 012-2h8a2 2 0 012 2v6" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 13h16v4H4z" /></>,
    cart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
    clipboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    package: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></>,

    // ── Status Dots ──
    dotGreen: null,    // filled circle
    dotRed: null,      // filled circle
    dotYellow: null,   // filled circle

    // ── Actions ──
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />,
    checkCircle: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    xMark: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />,
    xCircle: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,

    // ── Roles ──
    chef: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12a4 4 0 100-8 4 4 0 000 8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 4a4 4 0 018 0" /></>,
    cash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
    gear: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,

    // ── Food & Drink ──
    coffee: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 1v3M10 1v3M14 1v3" /></>,
    burger: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 15h16M4 15a8 8 0 0116 0M4 15v2a2 2 0 002 2h12a2 2 0 002-2v-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 11h16M8 11V9M12 11V8M16 11V9" /></>,
    pizza: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L3 19h18L12 2z" /><circle cx="10" cy="13" r="1" fill="currentColor" /><circle cx="14" cy="11" r="1" fill="currentColor" /><circle cx="12" cy="16" r="1" fill="currentColor" /></>,
    cake: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 20h18M5 20v-5a2 2 0 012-2h10a2 2 0 012 2v5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13v-2a2 2 0 012-2h10a2 2 0 012 2v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v4M8 7v2M16 7v2" /></>,
    plate: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a9 9 0 0118 0" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 17h20" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v4M9 3l3 6 3-6" /></>,

    // ── UI Elements ──
    phone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />,
    lightbulb: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
    timer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    hourglass: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3h14M5 21h14" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 3v4a5 5 0 005 5 5 5 0 005-5V3M7 21v-4a5 5 0 015-5 5 5 0 015 5v4" /></>,
    building: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    fire: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />,
    sparkle: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
    cheese: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L2 12h20L12 2z" /><circle cx="8" cy="10" r="1" fill="currentColor" /><circle cx="14" cy="9" r="1.5" fill="currentColor" /></>,
    mushroom: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v7M9 21h6" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 14c0-4.418 3.582-10 8-10s8 5.582 8 10H4z" /></>,
    leaf: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7M17 3a12.94 12.94 0 01-5 10M12 21C7 17 4 12 4 7" />,
    pepper: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2c-3 0-5 3-5 7s5 13 5 13 5-9 5-13-2-7-5-7z" />,
    bacon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7c2-3 4-1 6-4s4 1 6-2M4 13c2-3 4-1 6-4s4 1 6-2M4 19c2-3 4-1 6-4s4 1 6-2" /></>,

    // ── Feedback ──
    starFilled: <path fill="currentColor" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
    send: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />,
    chatBubble: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,

    // ── Dashboard ──
    chartBar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    currencyDollar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    refresh: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    arrowUp: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />,
    arrowDown: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />,
    bell: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    eye: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>,
    play: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />,
    warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    infoCircle: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    truck: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></>,
}

// Status dot component (filled circles)
const Dot = ({ color, className = 'w-3 h-3' }) => (
    <span className={`inline-block rounded-full ${className}`} style={{ backgroundColor: color }} />
)

const Icon = ({ name, className = 'w-5 h-5', style = {} }) => {
    // Status dots
    if (name === 'dotGreen') return <Dot color="#22c55e" className={className} />
    if (name === 'dotRed') return <Dot color="#ef4444" className={className} />
    if (name === 'dotYellow') return <Dot color="#eab308" className={className} />
    if (name === 'dotWhite') return <Dot color="#d1d5db" className={className} />

    const path = paths[name]
    if (!path) return <span className={className}>?</span>

    const isFilled = name === 'starFilled'

    return (
        <svg
            className={className}
            style={style}
            fill={isFilled ? 'currentColor' : 'none'}
            stroke={isFilled ? 'none' : 'currentColor'}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            {path}
        </svg>
    )
}

export default Icon
export { Icon }
