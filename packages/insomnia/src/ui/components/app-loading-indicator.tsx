// LOCAL BUILD: loading spinner shows the Libresomnia mark (open arc "C" with
// degree dot) instead of the upstream Insomnia logo SVG.
export const AppLoadingIndicator = () => (
  <div
    id="app-loading-indicator"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
    }}
  >
    <div
      style={{
        position: 'relative',
      }}
    >
      <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" strokeLinecap="round" width={100}>
        <path
          d="M 39 20.7 A 50 50 0 1 0 104.96 92.68"
          fill="none"
          stroke="#9BF0D6"
          strokeWidth={17}
        />
        <path
          d="M 104.96 35.32 A 50 50 0 0 0 39 20.7"
          fill="none"
          stroke="var(--hl)"
          strokeWidth={17}
        />
        <circle cx={113.8} cy={20.7} r={7} fill="#F2FBF8" />
        <circle
          cx={64}
          cy={64}
          r={62}
          fill="none"
          stroke="var(--hl)"
          strokeOpacity={0.8}
          strokeWidth={4}
          strokeDasharray="90,300,0,0"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 64 64"
            to="360 64 64"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  </div>
);
