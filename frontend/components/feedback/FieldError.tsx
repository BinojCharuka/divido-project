/** The message under a form field; link it with the field's aria-describedby. */
export function FieldError({ id, message }: { id: string; message: string | undefined | null }) {
  if (!message) return null;
  return (
    <span id={id} className="field-error">
      {message}
    </span>
  );
}

/** A form- or dialog-level error, announced immediately. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="field-error form-error" role="alert">
      {message}
    </p>
  );
}
