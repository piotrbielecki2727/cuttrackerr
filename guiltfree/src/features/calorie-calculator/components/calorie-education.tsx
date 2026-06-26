import { Card, CardContent } from "@/components/ui/card";

const EDUCATION_ITEMS = [
  {
    title: "Czym jest BMR?",
    content: [
      "BMR, czyli podstawowa przemiana materii, to szacunkowa liczba kalorii, którą organizm zużywa w spoczynku. To energia potrzebna na oddychanie, pracę serca, utrzymanie temperatury ciała, pracę mózgu i wszystkie podstawowe procesy życiowe.",
      "Możesz myśleć o BMR jak o koszcie działania organizmu, nawet gdybyś cały dzień leżał i nic nie robił. To nie jest jeszcze Twoje całe dzienne zapotrzebowanie, bo normalnie dochodzi do tego chodzenie, praca, treningi, kroki, trawienie i codzienne czynności.",
      "W kalkulatorze BMR liczymy ze wzoru Mifflina–St Jeora. To popularny wzór dający rozsądny punkt startowy, ale nadal jest to szacunek, a nie pomiar laboratoryjny.",
    ],
  },
  {
    title: "Czym jest TDEE?",
    content: [
      "TDEE to całkowite dzienne zapotrzebowanie energetyczne, czyli przybliżona liczba kalorii, którą spalasz w ciągu całego dnia. Obejmuje BMR oraz wszystko, co robisz poza leżeniem: pracę, chodzenie, treningi, sprzątanie, zakupy, schody, spacery i kroki.",
      "Dlatego dwie osoby o tej samej wadze i wzroście mogą mieć inne TDEE. Ktoś pracujący przy biurku i robiący 3000 kroków dziennie zwykle będzie potrzebował mniej kalorii niż osoba, która dużo chodzi, pracuje fizycznie albo regularnie biega.",
      "TDEE jest najlepszym punktem odniesienia do ustalenia kalorii na redukcję, utrzymanie lub masę. Jeśli przez kilka tygodni jesz blisko TDEE, masa ciała powinna być względnie stabilna, choć pojedyncze dni mogą się wahać.",
    ],
  },
  {
    title: "Czym jest BMI?",
    content: [
      "BMI to prosty wskaźnik oparty tylko na masie ciała i wzroście. Pokazuje relację wagi do wzrostu, ale nie mówi, z czego ta masa się składa.",
      "To oznacza, że BMI nie odróżnia tkanki tłuszczowej od mięśni, wody czy masy kostnej. Osoba bardzo umięśniona może mieć wysokie BMI, mimo że nie ma wysokiego poziomu tkanki tłuszczowej.",
      "Traktuj BMI jako ogólny, przesiewowy wskaźnik, a nie diagnozę. W praktyce dużo lepiej patrzeć razem na trend masy ciała, obwód talii, zdjęcia sylwetki, samopoczucie i wyniki zdrowotne, jeśli je kontrolujesz.",
    ],
  },
  {
    title: "Deficyt kaloryczny",
    content: [
      "Deficyt kaloryczny oznacza, że średnio jesz mniej kalorii, niż zużywa Twój organizm. Wtedy ciało musi pokryć część energii z zapasów, co z czasem może prowadzić do spadku masy ciała.",
      "Nie chodzi o to, żeby każdego dnia było idealnie. Liczy się średnia z tygodnia i trend z kilku tygodni. Jeden dzień z wyższymi kaloriami nie psuje procesu, tak samo jak jeden dzień bardzo niskich kalorii nie robi całej redukcji.",
      "Rozsądny deficyt zwykle jest łatwiejszy do utrzymania niż agresywne cięcie kalorii. Zbyt duży deficyt może pogarszać energię, sen, treningi i apetyt, więc wynik kalkulatora warto potem dopasować do realnych obserwacji.",
    ],
  },
  {
    title: "Nadwyżka kaloryczna",
    content: [
      "Nadwyżka kaloryczna oznacza, że średnio jesz więcej kalorii, niż zużywa organizm. To warunek sprzyjający zwiększaniu masy ciała.",
      "Jeśli celem jest budowanie mięśni, sama nadwyżka nie wystarczy. Najczęściej łączy się ją z treningiem siłowym, progresją obciążeń, odpowiednią ilością białka i regeneracją.",
      "Duża nadwyżka nie musi oznaczać lepszych efektów. Często lepiej zacząć od umiarkowanej nadwyżki i obserwować tempo przyrostu masy, siłę na treningach oraz obwody.",
    ],
  },
  {
    title: "Redukcja, utrzymanie i masa",
    content: [
      "Redukcja to jedzenie średnio poniżej zapotrzebowania. Celem jest stopniowy spadek masy ciała lub tkanki tłuszczowej.",
      "Utrzymanie wagi to jedzenie kalorii zbliżonych do zapotrzebowania. Masa ciała może mimo to skakać z dnia na dzień przez wodę, sól, węglowodany, stres, sen i zawartość przewodu pokarmowego.",
      "Masa to jedzenie średnio powyżej zapotrzebowania. Celem jest zwiększanie masy ciała, zwykle przy treningu siłowym i odpowiedniej podaży białka.",
      "W praktyce wybór trybu zależy od celu na najbliższe tygodnie, a nie od jednego dnia. Jeśli cel się zmienia, możesz wrócić do kalkulatora i przeliczyć plan.",
    ],
  },
  {
    title: "Jak wybrać poziom aktywności?",
    content: [
      "Poziom aktywności ma opisywać cały dzień, nie tylko trening. Ważne są: rodzaj pracy, liczba kroków, spacery, schody, prace domowe, rower, bieganie, treningi i ogólna ilość ruchu.",
      "Przykład: osoba trenująca 3 razy w tygodniu, ale poza tym siedząca cały dzień i robiąca mało kroków, może mieć niższą aktywność niż ktoś bez siłowni, ale chodzący dużo codziennie i pracujący fizycznie.",
      "Kroki mają duże znaczenie, bo są powtarzalnym ruchem wykonywanym często przez cały tydzień. Jeśli robisz dużo kroków każdego dnia albo regularnie biegasz, wybierz poziom aktywności, który to uwzględnia.",
      "Jeśli nie wiesz, co wybrać, zacznij od niższego rozsądnego poziomu i obserwuj wagę przez 2–3 tygodnie. Jeśli masa spada lub rośnie inaczej niż oczekujesz, skoryguj kalorie.",
    ],
  },
  {
    title: "Dlaczego waga zmienia się z dnia na dzień?",
    content: [
      "Waga nie pokazuje wyłącznie zmian tkanki tłuszczowej. Z dnia na dzień może zmieniać się przez ilość wody, soli, węglowodanów, porę ważenia, sen, stres, trening, cykl menstruacyjny i zawartość przewodu pokarmowego.",
      "Po większej ilości węglowodanów organizm może trzymać więcej glikogenu i wody. Po słonym posiłku waga też może chwilowo wzrosnąć. To nie oznacza automatycznie przyrostu tłuszczu.",
      "Dlatego najlepiej ważyć się w podobnych warunkach, np. rano po toalecie, i patrzeć na średnią lub trend, a nie na pojedynczy pomiar.",
    ],
  },
  {
    title: "Jak interpretować trend?",
    content: [
      "Trend to kierunek zmian widoczny z wielu pomiarów. Jeden pomiar może być przypadkowo wyższy lub niższy, ale seria pomiarów pokazuje, czy masa i obwody faktycznie idą w oczekiwaną stronę.",
      "Na redukcji warto patrzeć na średnią wagę z tygodnia oraz obwody, szczególnie talię. Na masie warto obserwować masę, siłę na treningach, obwody i tempo przyrostu.",
      "Jeśli przez 2–3 tygodnie trend nie idzie w stronę celu, możesz lekko skorygować kalorie albo poziom aktywności. Małe korekty są zwykle łatwiejsze do utrzymania niż gwałtowne zmiany.",
      "Nie oceniaj efektów po jednym dniu. Organizm jest trochę jak wykres z szumem — ważny jest kierunek linii, nie pojedyncza kropka.",
    ],
  },
];

export function CalorieEducation() {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-xl font-semibold">Jak działa kalkulator?</h2>
        <div className="mt-4 divide-y rounded-2xl border">
          {EDUCATION_ITEMS.map((item) => (
            <details className="group p-4" key={item.title}>
              <summary className="cursor-pointer list-none font-medium">
                {item.title}
              </summary>
              <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                {item.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
