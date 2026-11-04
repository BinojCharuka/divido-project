"use client";

import FigmaApp, { type FigmaAppProps } from "@/features/prototype/FigmaApp";

export type DividoAppProps = FigmaAppProps;

export function DividoApp(props: DividoAppProps) {
  return <FigmaApp {...props} />;
}

export default DividoApp;
