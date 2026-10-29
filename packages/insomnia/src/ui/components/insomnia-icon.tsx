// LOCAL BUILD: this file was modified relative to upstream Kong/insomnia (core@13.4.0) - see README.md
export const InsomniaLogo = ({ ...props }: {} & React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 128 128"
    width="28px"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    strokeLinecap="round"
    style={{
      zIndex: 1,
    }}
    {...props}
  >
    {/* Libresomnia mark: open arc ("C") with degree dot */}
    <path
      d="M 39 20.7 A 50 50 0 1 0 104.96 92.68"
      fill="none"
      stroke="#9BF0D6"
      strokeWidth={17}
    />
    <path
      d="M 104.96 35.32 A 50 50 0 0 0 39 20.7"
      fill="none"
      stroke="#E9FBF6"
      strokeWidth={17}
    />
    <circle cx={113.8} cy={20.7} r={7} fill="#F2FBF8" />
  </svg>
);
