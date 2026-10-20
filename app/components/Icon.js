/** Inline icons copied from the Sebas-Training.html sprite. */
const PATHS = {
  home: <path d="M4 10.6 12 4l8 6.6V20a1 1 0 0 1-1 1h-5.2v-6.1H10.2V21H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  workouts: <path d="M3 9.2v5.6M6.2 7v10M17.8 7v10M21 9.2v5.6M6.2 12h11.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
  progress: <path d="M4 19V5M4 19h16M8 15.5l3.1-3.6 2.8 2L19 8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  library: <path d="M5 5.2h5.6A2.2 2.2 0 0 1 12.8 7.4V20H7.2A2.2 2.2 0 0 0 5 17.8zM19 5.2h-5.6A2.2 2.2 0 0 0 11.2 7.4V20h5.6A2.2 2.2 0 0 0 19 17.8z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  person: <><circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M5.5 19.2c1.4-2.8 3.6-4 6.5-4s5.1 1.2 6.5 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></>,
  search: <><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="m15.8 15.8 3.4 3.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></>,
  chevron: <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  back: <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  close: <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
  bookmark: <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.4L6 20V5.5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  plus: <path d="M12 6v12M6 12h12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
  minus: <path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
  play: <path d="M9 7.5v9l8-4.5z" fill="currentColor" />,
  check: <path d="m6 12.5 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  clock: <><circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M12 8.5V12l2.6 2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></>,
  gear: <><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M12 4.2v2M12 17.8v2M4.2 12h2M17.8 12h2M6.4 6.4l1.4 1.4M16.2 16.2l1.4 1.4M17.6 6.4l-1.4 1.4M7.8 16.2l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></>,
  help: <><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M9.4 9.2a2.6 2.6 0 0 1 5.1.8c0 1.7-2.5 2-2.5 3.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><circle cx="12" cy="16.8" r=".8" fill="currentColor" /></>,
  backspace: <><path d="M8.2 6.5h11.2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8.2L3.5 12z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="m11 10 4 4M15 10l-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.7" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.7" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.7" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.7" /></>,
  layers: <path d="m12 4 8 4.2L12 12.4 4 8.2zM4 12.2l8 4.2 8-4.2M4 15.6 12 19.8l8-4.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  heart: <path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.6 3.5 7 5.5 5 8 5c1.6 0 3.1.8 4 2.1C12.9 5.8 14.4 5 16 5c2.5 0 4.5 2 4.5 4.6 0 3.7-3.5 6.9-8.5 10.9z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  grip: <><circle cx="9" cy="6" r="1.4" fill="currentColor" /><circle cx="15" cy="6" r="1.4" fill="currentColor" /><circle cx="9" cy="12" r="1.4" fill="currentColor" /><circle cx="15" cy="12" r="1.4" fill="currentColor" /><circle cx="9" cy="18" r="1.4" fill="currentColor" /><circle cx="15" cy="18" r="1.4" fill="currentColor" /></>,
  list: <><path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><circle cx="4.8" cy="6.5" r="1.2" fill="currentColor" /><circle cx="4.8" cy="12" r="1.2" fill="currentColor" /><circle cx="4.8" cy="17.5" r="1.2" fill="currentColor" /></>,
};

export default function Icon({ name, className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
