'use client'

import { Minus, Plus } from 'lucide-react'

interface RoomWithQty {
  key: string
  label: string
  emoji: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}

interface RoomToggle {
  key: string
  label: string
  emoji: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}

interface RoomPickerProps {
  roomsWithQty: RoomWithQty[]
  toggleRooms: RoomToggle[]
  priceConfig?: Record<string, number>
}

function QtyControl({ item }: { item: RoomWithQty }) {
  const min = item.min ?? 0
  const max = item.max ?? 20

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all
      ${item.value > 0
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{item.emoji}</span>
        <div>
          <p className="font-medium text-sm">{item.label}</p>
          {item.value === 0 && <p className="text-xs text-gray-400">Não tem</p>}
          {item.value > 0 && (
            <p className="text-xs text-blue-600 font-medium">
              {item.value} {item.value === 1 ? 'unidade' : 'unidades'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => item.onChange(Math.max(min, item.value - 1))}
          disabled={item.value <= min}
          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center
            hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-8 text-center font-bold text-sm">{item.value}</span>
        <button
          type="button"
          onClick={() => item.onChange(Math.min(max, item.value + 1))}
          disabled={item.value >= max}
          className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center
            hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function ToggleRoom({ item }: { item: RoomToggle }) {
  return (
    <button
      type="button"
      onClick={() => item.onChange(!item.checked)}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left w-full transition-all
        ${item.checked
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
    >
      <span className="text-2xl">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{item.label}</p>
        <p className="text-xs text-gray-400 truncate">{item.description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
        ${item.checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
        {item.checked && <span className="text-white text-xs">✓</span>}
      </div>
    </button>
  )
}

export function RoomPicker({ roomsWithQty, toggleRooms }: RoomPickerProps) {
  return (
    <div className="space-y-5">
      {/* Cômodos com quantidade */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">Q</span>
          Ambientes — selecione a quantidade
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {roomsWithQty.map((item) => (
            <QtyControl key={item.key} item={item} />
          ))}
        </div>
      </div>

      {/* Áreas extras toggle */}
      {toggleRooms.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">+</span>
            Áreas especiais — selecione as que possui
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {toggleRooms.map((item) => (
              <ToggleRoom key={item.key} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
