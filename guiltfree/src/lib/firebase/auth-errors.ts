import { FirebaseError } from "firebase/app";

export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "Konto z tym adresem e-mail już istnieje.";

    case "auth/invalid-email":
      return "Podaj prawidłowy adres e-mail.";

    case "auth/weak-password":
      return "Hasło jest zbyt słabe.";

    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Nieprawidłowy e-mail lub hasło.";

    case "auth/user-disabled":
      return "To konto zostało wyłączone.";

    case "auth/too-many-requests":
      return "Za dużo prób. Odczekaj chwilę i spróbuj ponownie.";

    case "auth/network-request-failed":
      return "Brak połączenia z internetem.";

    default:
      return "Nie udało się wykonać operacji. Spróbuj ponownie.";
  }
}