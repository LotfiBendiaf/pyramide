import { Quote, Star, UserStar } from "lucide-react";

export default function ReviewCard() {
  return (
    <div className="relative w-fit container mx-auto p-6 rounded-2xl bg-white/70 backdrop-blur-sm shadow-md border space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          Mehdi Abdelhadi recommande{" "}
          <span className="text-primary">Agence Pyramide Immobilier</span>
        </h2>
      </div>

      {/* Review Text */}
      <p className="text-gray-700 text-sm leading-relaxed">
        Un groupe jeune et professionnel, j&apos;espère qu&apos;on aura
        l&apos;occasion de travailler ensemble de nouveau. Je suis très
        satisfait <span className="font-semibold">10/10</span>.
      </p>

      {/* Stars */}
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-600">5.0</span>
      </div>
      {/* Date */}
      <p className="text-muted-foreground text-xs">18 Février 2023</p>

      {/* Reviewer Badge */}
      <span className="absolute -bottom-3 right-8 text-sm bg-white px-3 py-1 rounded-full shadow-sm border font-medium">
        Mehdi Abdelhadi
      </span>
      <Quote className="absolute -top-3 right-3 size-8 text-orange-800" />
      <UserStar className="absolute -top-3 left-3 size-8 text-orange-800 bg-white rounded-full p-1" />
    </div>
  );
}
