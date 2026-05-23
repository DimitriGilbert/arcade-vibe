export type JsonLdPrimitive = string | number | boolean | null;
export type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[];

export interface JsonLdObject {
  [key: string]: JsonLdValue;
}

interface JsonLdProps {
  data: JsonLdObject | JsonLdObject[];
  id?: string;
}

export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
