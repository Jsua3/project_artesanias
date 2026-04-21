// Inline SVG icon set — Lucide-inspired, stroke 1.5, 20px default.
// Used as fallback (and primary source) because Google Material Symbols font
// may be blocked in this sandbox.
const ICONS = {
  dashboard: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
  person_pin: 'M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zM12 12a3 3 0 110-6 3 3 0 010 6z',
  category: 'M12 2l4 7H8l4-7zM5 14h6v6H5zM13 14h6v6h-6z',
  palette: 'M12 3a9 9 0 100 18c1 0 1.5-.5 1.5-1.5 0-.4-.2-.8-.5-1-.3-.3-.5-.7-.5-1a1 1 0 011-1h2a4 4 0 004-4 9 9 0 00-7.5-9.5zM6.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM9.5 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM14.5 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM17.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
  people_outline: 'M9 11a4 4 0 100-8 4 4 0 000 8zM17 13a3 3 0 100-6 3 3 0 000 6zM3 21v-2a6 6 0 016-6h0a6 6 0 016 6v2M17 14a4 4 0 014 4v3',
  point_of_sale: 'M4 6h16v4H4zM5 10v10h14V10M9 14h6M9 17h6',
  warehouse: 'M3 21V9l9-5 9 5v12M9 21v-8h6v8',
  add_circle_outline: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v8M8 12h8',
  remove_circle_outline: 'M12 3a9 9 0 100 18 9 9 0 000-18zM8 12h8',
  assessment: 'M4 4h16v16H4zM8 16v-4M12 16V8M16 16v-6',
  dashboard_fill: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
  add: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  edit: 'M4 20h4L20 8l-4-4L4 16v4zM14 6l4 4',
  delete: 'M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13M9 7V4h6v3',
  close: 'M6 6l12 12M6 18L18 6',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  person: 'M12 12a5 5 0 100-10 5 5 0 000 10zM3 22v-2a6 6 0 016-6h6a6 6 0 016 6v2',
  place: 'M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zM12 12a3 3 0 110-6 3 3 0 010 6z',
  schedule: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
  arrow_forward: 'M5 12h14M13 5l7 7-7 7',
  arrow_upward: 'M12 19V5M5 12l7-7 7 7',
  arrow_downward: 'M12 5v14M5 12l7 7 7-7',
  warning: 'M12 2l10 18H2L12 2zM12 9v5M12 17v1',
  warning_amber: 'M12 2l10 18H2L12 2zM12 9v5M12 17v1',
  inventory_2: 'M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10',
  add_shopping_cart: 'M3 3h2l3 12h11l2-8H6M9 19a1 1 0 110 2 1 1 0 010-2zM18 19a1 1 0 110 2 1 1 0 010-2zM16 7v6M13 10h6',
  cancel: 'M12 3a9 9 0 100 18 9 9 0 000-18zM9 9l6 6M15 9l-6 6',
  file_download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  edit_small: 'M4 20h4L20 8l-4-4L4 16v4z',
  filter_list: 'M3 5h18M7 12h10M11 19h2',
  more_vert: 'M12 5a1 1 0 110 2 1 1 0 010-2zM12 11a1 1 0 110 2 1 1 0 010-2zM12 17a1 1 0 110 2 1 1 0 010-2z',
};

const Icon = ({ name, size = 20, style = {}, className = '' }) => {
  const d = ICONS[name] || ICONS.category;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
         fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round"
         className={className}
         style={{flexShrink: 0, ...style}}>
      {d.split('M').filter(Boolean).map((p, i) => (
        <path key={i} d={'M' + p} />
      ))}
    </svg>
  );
};

window.Icon = Icon;
