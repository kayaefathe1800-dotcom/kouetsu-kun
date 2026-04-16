const CATEGORY_COLORS: Record<string, string> = {
  費用表現: 'bg-amber-100 text-amber-800',
  誇張表現: 'bg-red-100 text-red-800',
  断定表現: 'bg-orange-100 text-orange-800',
  不安あおり: 'bg-rose-100 text-rose-800',
  社名: 'bg-purple-100 text-purple-800',
  色提案: 'bg-blue-100 text-blue-800',
  工法断定: 'bg-cyan-100 text-cyan-800',
  その他: 'bg-gray-100 text-gray-700',
}

export default function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] ?? CATEGORY_COLORS['その他']
  return (
    <span className={`badge ${cls}`}>
      {category}
    </span>
  )
}
