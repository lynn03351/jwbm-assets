import { useMemo, useState } from 'react'
import { Card } from '@astryxdesign/core/Card'
import { Stack } from '@astryxdesign/core/Stack'
import { Grid } from '@astryxdesign/core/Grid'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Table } from '@astryxdesign/core/Table'
import { Divider } from '@astryxdesign/core/Divider'
import { FileInput } from '@astryxdesign/core/FileInput'
import { Banner } from '@astryxdesign/core/Banner'
import * as XLSX from 'xlsx'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts'

/* ─────────────────────────────── 상수 ─────────────────────────────── */

const CH = {
  APP:         { label: 'APP',         color: 'var(--ch-app, #1c4f3a)' },
  KAKAO_INAPP: { label: 'KAKAO_INAPP', color: 'var(--ch-kakao, #e6b422)' },
  MOBILE_WEB:  { label: 'MOBILE_WEB',  color: 'var(--ch-mobile, #4d8f7b)' },
  PC_WEB:      { label: 'PC_WEB',      color: 'var(--ch-pc, #97a3a0)' },
}
const CH_KEYS = Object.keys(CH)
const EXCLUDE_STATUS = /취소|휴지통|미입금/

const won = (n) => (n ?? 0).toLocaleString('ko-KR') + '원'
const manwon = (n) => Math.round(n / 10000).toLocaleString('ko-KR') + '만'
const pct = (n) => (n * 100).toFixed(1) + '%'

/* ─────────────────────────── 샘플 데이터 (주간) ─────────────────────────── */
/* 실데이터 업로드 전 레이아웃 검증용. 6/29(월)–7/5(일) 가상 주간. */

function buildSample() {
  const days = ['06-29 (월)', '06-30 (화)', '07-01 (수)', '07-02 (목)', '07-03 (금)', '07-04 (토)', '07-05 (일)']
  // 토요일 친구톡 발송 반영해 주말 KAKAO 스파이크
  const base = [
    { APP: 9.2,  KAKAO_INAPP: 2.1, MOBILE_WEB: 4.8, PC_WEB: 2.4 },
    { APP: 8.7,  KAKAO_INAPP: 1.9, MOBILE_WEB: 4.5, PC_WEB: 2.2 },
    { APP: 10.4, KAKAO_INAPP: 2.3, MOBILE_WEB: 5.1, PC_WEB: 2.6 }, // 등급제 오픈
    { APP: 9.0,  KAKAO_INAPP: 2.0, MOBILE_WEB: 4.6, PC_WEB: 2.3 },
    { APP: 9.6,  KAKAO_INAPP: 2.2, MOBILE_WEB: 4.9, PC_WEB: 2.5 },
    { APP: 11.8, KAKAO_INAPP: 8.9, MOBILE_WEB: 6.2, PC_WEB: 2.1 }, // 친구톡 발송일
    { APP: 10.9, KAKAO_INAPP: 5.4, MOBILE_WEB: 5.7, PC_WEB: 2.0 }, // SMS 페일오버
  ]
  const daily = days.map((d, i) => {
    const row = { day: d }
    CH_KEYS.forEach((k) => { row[k] = Math.round(base[i][k] * 1_000_000) })
    row.total = CH_KEYS.reduce((s, k) => s + row[k], 0)
    return row
  })
  const products = [
    { rank: 1,  name: '국내산 추어탕 (임귀범)',    revenue: 31_240_000, orders: 612, note: '고마진' },
    { rank: 2,  name: '능이백숙 세트',            revenue: 24_180_000, orders: 402, note: '' },
    { rank: 3,  name: '유정란 30구',              revenue: 16_920_000, orders: 941, note: '' },
    { rank: 4,  name: '냉동 블루베리 퓨레',        revenue: 13_450_000, orders: 487, note: '인플루언서' },
    { rank: 5,  name: '삼계탕 (반계탕)',          revenue: 12_010_000, orders: 355, note: '복날' },
    { rank: 6,  name: '쪼갠 청매실 5kg',          revenue: 9_870_000,  orders: 214, note: '' },
    { rank: 7,  name: '엑스트라버진 올리브오일',    revenue: 8_420_000,  orders: 268, note: '인플루언서' },
    { rank: 8,  name: '애사비 스틱 30포',          revenue: 7_130_000,  orders: 331, note: '' },
    { rank: 9,  name: '단호박 백김치 2kg',         revenue: 6_540_000,  orders: 189, note: '' },
    { rank: 10, name: '국내산 건홍합 200g',        revenue: 5_210_000,  orders: 243, note: '' },
  ]
  const total = daily.reduce((s, d) => s + d.total, 0)
  return {
    label: '2026.06.29 – 07.05 (주간)',
    isSample: true,
    daily,
    products,
    total,
    orders: 3892,
    prevTotal: Math.round(total / 1.073), // 전주 대비 +7.3% 가정
    excluded: 214,
  }
}

/* ──────────────────── FLEXG 매출 파일 파싱 (휴리스틱) ──────────────────── */

const findCol = (headers, patterns) =>
  headers.findIndex((h) => patterns.some((p) => String(h || '').includes(p)))

function mapChannel(v) {
  const s = String(v || '')
  if (/앱|APP|app/i.test(s)) return 'APP'
  if (/카카오|kakao/i.test(s)) return 'KAKAO_INAPP'
  if (/모바일|mobile/i.test(s)) return 'MOBILE_WEB'
  return 'PC_WEB'
}

async function parseFlexgFile(file) {
  const buf = await file.arrayBuffer()
  let wb
  try {
    wb = XLSX.read(buf, { type: 'array' })
  } catch {
    // FLEXG .xls는 HTML 포맷 + EUC-KR 가능성 → 텍스트 폴백
    for (const enc of ['utf-8', 'euc-kr']) {
      try {
        wb = XLSX.read(new TextDecoder(enc).decode(buf), { type: 'string' })
        break
      } catch { /* 다음 인코딩 시도 */ }
    }
  }
  if (!wb) throw new Error('파일을 읽지 못했어요. 원본 그대로 다시 업로드해 주세요.')

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false })
  const hIdx = rows.findIndex((r) => r?.some((c) => String(c || '').includes('주문번호')))
  if (hIdx < 0) throw new Error('주문번호 컬럼을 찾지 못했어요. 파일 샘플을 공유해주면 파싱을 맞출게요.')

  const H = rows[hIdx]
  const col = {
    orderNo: findCol(H, ['주문번호']),
    date:    findCol(H, ['주문일', '결제일']),
    amount:  findCol(H, ['실결제', '결제금액', '결제 금액', '판매금액', '총 결제']),
    status:  findCol(H, ['주문상태', '처리상태', '상태']),
    channel: findCol(H, ['주문경로', '유입', '채널', '접속']),
    product: findCol(H, ['상품명', '상품 명']),
  }
  if (col.amount < 0) throw new Error('결제금액 컬럼을 찾지 못했어요. 파일 샘플을 공유해주면 파싱을 맞출게요.')

  const num = (v) => Number(String(v ?? '').replace(/[^0-9.-]/g, '')) || 0
  const seen = new Set()
  const dailyMap = new Map()
  const prodMap = new Map()
  let total = 0, orders = 0, excluded = 0
  let minD = null, maxD = null

  for (const r of rows.slice(hIdx + 1)) {
    if (!r || r.length === 0) continue
    const status = col.status >= 0 ? String(r[col.status] || '') : ''
    if (EXCLUDE_STATUS.test(status)) { excluded++; continue }

    const orderNo = col.orderNo >= 0 ? String(r[col.orderNo] || '') : ''
    const rawDate = col.date >= 0 ? String(r[col.date] || '') : ''
    const day = rawDate.slice(5, 10) || '미상'
    const ch = col.channel >= 0 ? mapChannel(r[col.channel]) : 'PC_WEB'
    const amt = num(r[col.amount])

    // 매출 = 주문번호 중복 제거 (첫 행 기준) — 회의자료 산출 방식과 동일
    const isNew = orderNo && !seen.has(orderNo)
    if (isNew || !orderNo) {
      if (orderNo) seen.add(orderNo)
      orders++
      total += amt
      if (!dailyMap.has(day)) {
        const init = { day }
        CH_KEYS.forEach((k) => (init[k] = 0))
        init.total = 0
        dailyMap.set(day, init)
      }
      const d = dailyMap.get(day)
      d[ch] += amt
      d.total += amt
      if (rawDate) {
        if (!minD || rawDate < minD) minD = rawDate
        if (!maxD || rawDate > maxD) maxD = rawDate
      }
    }
    // 상품 집계는 행 단위
    const pname = col.product >= 0 ? String(r[col.product] || '').trim() : ''
    if (pname) {
      const p = prodMap.get(pname) || { name: pname, revenue: 0, orders: 0, note: '' }
      p.revenue += amt
      p.orders += 1
      prodMap.set(pname, p)
    }
  }

  const daily = [...dailyMap.values()].sort((a, b) => a.day.localeCompare(b.day))
  const products = [...prodMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  return {
    label: minD && maxD ? `${minD.slice(0, 10)} – ${maxD.slice(0, 10)}` : file.name,
    isSample: false,
    daily, products, total, orders,
    prevTotal: null,
    excluded,
  }
}

/* ─────────────────────────────── 뷰 조각 ─────────────────────────────── */

function Kpi({ label, value, sub }) {
  return (
    <Card padding={3}>
      <Stack gap={1}>
        <Text type="supporting" color="secondary">{label}</Text>
        <Text type="display-3" weight="bold">{value}</Text>
        {sub}
      </Stack>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-background-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
      boxShadow: 'var(--shadow-med, 0 2px 8px rgba(0,0,0,.08))',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {CH[p.dataKey]?.label ?? p.name}: {won(p.value)}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────── 메인 ─────────────────────────────── */

export default function App() {
  const [data, setData] = useState(buildSample)
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)

  const onFile = async (f) => {
    setFile(f)
    setError(null)
    if (!f) return
    try {
      setData(await parseFlexgFile(f))
    } catch (e) {
      setError(e.message)
    }
  }

  const channelTotals = useMemo(() =>
    CH_KEYS.map((k) => ({
      key: k,
      name: CH[k].label,
      value: data.daily.reduce((s, d) => s + (d[k] || 0), 0),
    })).filter((c) => c.value > 0), [data])

  const aov = data.orders ? Math.round(data.total / data.orders) : 0
  const wow = data.prevTotal ? (data.total - data.prevTotal) / data.prevTotal : null

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px 64px' }}>
      <Stack gap={4}>

        {/* 헤더 */}
        <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
          <div style={{ flex: 1, minWidth: 260 }}>
            <Stack gap={0.5}>
              <Stack direction="horizontal" gap={1.5} vAlign="center">
                <Text type="display-2" weight="bold">제철밥상 매출 대시보드</Text>
                {data.isSample && <Badge variant="warning" label="샘플 데이터" />}
              </Stack>
              <Text color="secondary">{data.label} · 주문취소·휴지통·미입금 제외 · 주문번호 중복 제거 기준</Text>
            </Stack>
          </div>
          <div style={{ width: 320 }}>
            <FileInput
              label="FLEXG 매출 파일"
              description=".xls / .xlsx / .csv"
              value={file}
              onChange={onFile}
              accept=".xls,.xlsx,.csv"
            />
          </div>
        </Stack>

        {error && <Banner status="error" title="파싱 실패" description={error} />}

        {/* KPI */}
        <Grid columns={{ minWidth: 220 }} gap={3}>
          <Kpi
            label="총 매출"
            value={won(data.total)}
            sub={wow != null ? (
              <Badge
                variant={wow >= 0 ? 'success' : 'error'}
                label={`전주 대비 ${wow >= 0 ? '+' : ''}${pct(wow)}`}
              />
            ) : null}
          />
          <Kpi label="순 주문수" value={data.orders.toLocaleString('ko-KR') + '건'}
               sub={<Text type="supporting" color="secondary">주문번호 기준</Text>} />
          <Kpi label="객단가" value={won(aov)}
               sub={<Text type="supporting" color="secondary">매출 ÷ 순 주문수</Text>} />
          <Kpi label="제외 처리" value={data.excluded.toLocaleString('ko-KR') + '행'}
               sub={<Text type="supporting" color="secondary">취소·휴지통·미입금</Text>} />
        </Grid>

        {/* 차트 영역 */}
        <Grid columns={{ minWidth: 340 }} gap={3}>
          <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
            <Card padding={3}>
              <Stack gap={2}>
                <Text type="label" weight="semibold">일별 매출 (채널 누적)</Text>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={manwon} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={52} />
                    <RTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
                    {CH_KEYS.map((k) => (
                      <Bar key={k} dataKey={k} stackId="rev" fill={CH[k].color}
                           radius={k === 'PC_WEB' ? [4, 4, 0, 0] : 0} maxBarSize={44} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Stack>
            </Card>
          </div>

          <Card padding={3}>
            <Stack gap={2}>
              <Text type="label" weight="semibold">채널별 매출 비중</Text>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={channelTotals} dataKey="value" nameKey="name"
                       innerRadius={62} outerRadius={95} paddingAngle={2} strokeWidth={0}>
                    {channelTotals.map((c) => <Cell key={c.key} fill={CH[c.key].color} />)}
                  </Pie>
                  <RTooltip formatter={(v, n) => [won(v) + ` (${pct(v / data.total)})`, n]} />
                  <Legend iconType="circle" iconSize={9}
                          formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </Stack>
          </Card>
        </Grid>

        {/* 상품 TOP 10 */}
        <Card padding={3}>
          <Stack gap={2}>
            <Stack direction="horizontal" gap={2} vAlign="center">
              <Text type="label" weight="semibold">상품 매출 TOP 10</Text>
              <Text type="supporting" color="secondary">행 단위 집계</Text>
            </Stack>
            <Table
              data={data.products}
              idKey="rank"
              density="balanced"
              dividers="rows"
              columns={[
                { key: 'rank', header: '#' },
                { key: 'name', header: '상품명',
                  renderCell: (p) => (
                    <Stack direction="horizontal" gap={1.5} vAlign="center">
                      <Text weight="medium">{p.name}</Text>
                      {p.note ? <Badge variant="green" label={p.note} /> : null}
                    </Stack>
                  ) },
                { key: 'revenue', header: '매출', renderCell: (p) => won(p.revenue) },
                { key: 'orders', header: '주문수', renderCell: (p) => p.orders.toLocaleString('ko-KR') },
                { key: 'share', header: '비중', renderCell: (p) => pct(p.revenue / data.total) },
              ]}
            />
          </Stack>
        </Card>

        <Divider />
        <Text type="supporting" color="secondary">
          제철밥상 자사몰 관리팀 · Astryx (Meta, Beta) 기반 · 매출 산출식은 정기 회의자료와 동일
        </Text>
      </Stack>
    </div>
  )
}
