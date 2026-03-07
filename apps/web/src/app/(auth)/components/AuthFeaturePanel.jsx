export default function AuthFeaturePanel({ badge, title, description, features, tip }) {
  return (
    <div className="hidden md:flex flex-col justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-8 text-white shadow-xl">
      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
        {badge}
      </div>

      <h2 className="text-3xl font-bold mt-4">{title}</h2>

      <p className="text-indigo-100 mt-3">{description}</p>

      <ul className="mt-6 space-y-3 text-indigo-100">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-white">{"\u2714"}</span> {feature}
          </li>
        ))}
      </ul>

      {tip && (
        <div className="mt-8 rounded-2xl bg-white/10 p-5">
          <p className="text-sm text-indigo-100">{tip}</p>
        </div>
      )}
    </div>
  );
}
