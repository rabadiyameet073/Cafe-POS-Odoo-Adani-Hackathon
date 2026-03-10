const BackgroundBlobs = () => {
  return (
    <>
      {/* Subtle animated blobs for depth */}
      <div
        className="fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none blur-[100px]"
        style={{
          background: 'var(--blob-1)',
          boxShadow: '0 0 120px var(--blob-1)',
          animation: 'floatBlob 25s ease-in-out infinite',
        }}
      />
      <div
        className="fixed bottom-[-250px] right-[-250px] w-[600px] h-[600px] rounded-full pointer-events-none blur-[120px]"
        style={{
          background: 'var(--blob-2)',
          boxShadow: '0 0 140px var(--blob-2)',
          animation: 'floatBlob 30s ease-in-out infinite reverse',
        }}
      />
      <div
        className="fixed top-1/3 right-1/4 w-[350px] h-[350px] rounded-full pointer-events-none blur-[140px]"
        style={{
          background: 'var(--blob-3)',
          boxShadow: '0 0 110px var(--blob-3)',
          animation: 'floatBlob 35s ease-in-out infinite 5s',
        }}
      />
    </>
  )
}

export default BackgroundBlobs

