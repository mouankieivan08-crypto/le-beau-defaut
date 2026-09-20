"use client";

import { useActionState, useTransition } from "react";

/**
 * Variante de useActionState qui NE vide PAS le formulaire après l'envoi.
 *
 * Avec <form action={...}>, React 19 réinitialise les champs non contrôlés à la fin
 * de chaque soumission — y compris quand le serveur renvoie une erreur de validation.
 * L'utilisateur perdrait alors sa saisie. Ici on soumet via onSubmit + startTransition :
 * les champs restent remplis, et le bouton cliqué (ex. « Brouillon ») est bien transmis.
 */
export function useStickyAction<S>(action: (prev: S, formData: FormData) => Promise<S>, initialState: S) {
  // Les états manipulés ici ne sont jamais des promesses : Awaited<S> équivaut à S.
  const [state, dispatch, pending] = useActionState<S, FormData>(
    action as (prev: Awaited<S>, formData: FormData) => Promise<S>,
    initialState as Awaited<S>
  );
  const [, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  };

  return [state, onSubmit, pending] as const;
}
