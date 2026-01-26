import React from 'react';
import { FlexAtomicKey, flexMap, flexMapping, FlexProps } from './styleMappings';
type FAK = FlexAtomicKey;

export const Flx: React.FC<React.PropsWithChildren<FlexProps & { as?: keyof JSX.IntrinsicElements }>> = ({
  children,
  style,
  as: Component = 'div',
  ...rest
}) => {
  const atomicStyle: React.CSSProperties = { display: 'flex', flexFlow: 'column' };

  for (const key in rest) {
    // @ts-ignore
    const val = rest[key as FAK];
    if (val && key in flexMapping) {
      const mapp = flexMapping[key as FAK];
      // @ts-ignore
      Object.assign(atomicStyle, { [mapp.attr]: mapp.vals[val] });
      // @ts-ignore
      delete rest[key]; // remove atomic key from final HTML props
    } else if (val && key in flexMap) {
      // @ts-ignore
      const style = flexMap[key];
      Object.assign(atomicStyle, style);
      // @ts-ignore
      delete rest[key];
    }
  }

  // @ts-ignore
  if (Component !== 'div' && (rest as any).as) {
    delete (rest as any).as;
  }

  return (
    // @ts-ignore
    <Component {...rest} style={{ ...atomicStyle, ...style }}>
      {children}
    </Component>
  );
};
