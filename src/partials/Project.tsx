import type { ReactNode } from 'react';

interface Props {
  svg: ReactNode;
  name: ReactNode;
  description: ReactNode;
  href: string;
}

export default function Project({ description, name, svg, href }: Props) {
  return (
    <a
      href={href}
      className="flex flex-row gap-4 rounded-xl bg-bg2 p-4 transition hover:bg-p1/10"
    >
      <div className="flex flex-col gap-4">
        <p className="text-2xl font-bold">{name}</p>
        <p>{description}</p>
      </div>
    </a>
  );
}
