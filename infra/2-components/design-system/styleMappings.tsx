import React, { HTMLAttributes } from 'react';

type Enumerate<N extends number, Acc extends number[] = []> =
  Acc["length"] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc["length"]]>;

type Range<From extends number, To extends number> =
  Exclude<Enumerate<To>, Enumerate<From>> | To;

type RangeObject<From extends number, To extends number> = {
  [K in Range<From, To>]: string
};

export function step<const From extends number, const To extends number>(
  from: From,
  to: To,
  step: number=4,
  units: string='px'
): RangeObject<From, To> {
  const out: Record<number, string> = {};
  for (let ii = from; ii <= to; ii++) out[ii] = ii * step + units;
  return out as RangeObject<From, To>;
}

export const flexMapping = {
  j: {
    attr: 'justifyContent',
    vals: {
      s: 'flex-start',
      c: 'center',
      e: 'end',
    }
  },
  ai: {
    attr: 'alignItems',
    vals: {
      c: 'center',
      s: 'flex-start'
    }
  },
  d: {
    attr: 'flexDirection',
    vals: {
      r: 'row',
      c: 'column',
      rr: 'row-reverse',
      cr: 'column-reverse',
      in: 'initial',
      ih: 'inherit'
    }
  },
  w: {
    attr: 'width',
    vals: {
      f: '100%',
      a: 'auto',
      24: '96px',
      48: '192px',
      6: '24px',
    }
  },
  maxw: {
    attr: 'maxWidth',
    vals: {
      350: '350px',
      700: '700px',
    }
  },
  h: {
    attr: 'height',
    vals: {
      f: '100%',
      a: 'auto',
      6: '24px',
    }
  },
  cp: {
    attr: 'cursor',
    vals: {
      p: 'pointer',
    }
  },
  fz: {
    attr: 'fontSize',
    vals: {
      s: '14px',
      b: '16px',
    }
  },
  c: {
    attr: 'color',
    vals: {
      g6: '#6b7280',
      o: '#ea580c',
      r: '#dc2626',
    }
  },
  bg: {
    attr: 'backgroundColor',
    vals: {
      w: 'white',
    }
  },
  br: {
    attr: 'borderRadius',
    vals: {
      s: '4px',
      l: '8px',
    }
  },
  bor: {
    attr: 'border',
    vals: {
      1: '1px solid #d1d5db',
    }
  },
  ml: {
    attr: 'marginLeft',
    vals: {
      a: 'auto',
    }
  },
  pos: {
    attr: 'position',
    vals: {
      r: 'relative',
    }
  },
  trans: {
    attr: 'transition',
    vals: {
      o: 'opacity 0.15s ease',
    }
  },
  p: {
    attr: 'padding',
    vals: step(0, 8)
  },
  py: {
    attr: 'paddingY',
    vals: step(0, 8)
  },
  mt: {
    attr: 'marginTop',
    vals: step(0, 8)
  },
  g: {
    attr: 'gap',
    vals: step(0, 8)
  },
  gg: {
    attr: 'flexGrow',
    vals: {
      0: 0,
      1: 1
    }
  },
  fs: {
    attr: 'flexShrink',
    vals: {
      0: 0,
      1: 1
    }
  },
  fw: {
    attr: 'fontWeight',
    vals: {
      n: 'normal',
      m: '500',
      sb: '600',
      b: '700'
    }
  }
} as const;

export const flexMap = Object.entries(flexMapping).reduce((acc, [prefix, { attr, vals }]) => {
  Object.entries(vals).forEach(([suffix, val]) => {
    // @ts-ignore
    acc[prefix + suffix] = { [attr]: val };
  })
  return acc;
}, {}) as { [k in FlexBooleanProp]: React.CSSProperties };

export type FlexMap = typeof flexMapping;
export type FlexAtomicKey = keyof typeof flexMapping;
export type FlexAtomicOpts<T extends FlexAtomicKey> = keyof typeof flexMapping[T]['vals'];

    // For “j” → “s” | “c” | “e”
export type FlexAtomicValues<K extends FlexAtomicKey> =
  keyof FlexMap[K]['vals'];

// Boolean prop keys: “js”, “jc”, “je”, “aic”, “dr”, “dcr”, etc.
export type FlexBooleanProp = {
  // @ts-ignore
  [K in FlexAtomicKey]: `${K}${FlexAtomicValues<K>}`
}[FlexAtomicKey];

// props types
// shorthands: jc, wf, etc.
export type FlexBooleanProps = {
  [B in FlexBooleanProp]?: boolean;
}
// longhand: j='c', w='f', etc.
export type FlexValueProps = {
  [K in FlexAtomicKey]?: FlexAtomicOpts<K>;
};

export interface FlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    FlexBooleanProps,
    FlexValueProps {}
  // extends FlexAtomicProps,
  //   Omit<HTMLAttributes<HTMLDivElement>, keyof FlexAtomicProps> {}


export const gridMapping = {
  gtc2: { gridTemplateColumns: 'repeat(2, 1fr)' },
  gap4: { gap: '1rem' },
} as const;

export type GridAtomicKey = keyof typeof gridMapping;
export type GridAtomicStyles = typeof gridMapping[GridAtomicKey];

export type GridAtomicProps = {
  [K in GridAtomicKey]?: boolean;
};

export interface GridProps
  extends GridAtomicProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof GridAtomicProps> {}