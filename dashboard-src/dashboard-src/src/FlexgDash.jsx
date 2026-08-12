import { useState, useRef, useMemo, useEffect, Component } from 'react'
import { Card } from '@astryxdesign/core/Card'
import { Stack } from '@astryxdesign/core/Stack'
import { Grid } from '@astryxdesign/core/Grid'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, useTableSortable } from '@astryxdesign/core/Table'
import { Divider } from '@astryxdesign/core/Divider'
import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { DateRangeInput } from '@astryxdesign/core/DateRangeInput'
import { Selector } from '@astryxdesign/core/Selector'
import { MultiSelector } from '@astryxdesign/core/MultiSelector'
import { Switch } from '@astryxdesign/core/Switch'
import { TextArea } from '@astryxdesign/core/TextArea'
import { TextInput } from '@astryxdesign/core/TextInput'
import { TabList, Tab } from '@astryxdesign/core/TabList'
import { toBlob } from 'html-to-image'
import { projectMembers } from './memberProject.js'
export { projectMembers }
import MemberWorker from './memberWorker.js?worker&inline'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { Layout, LayoutContent } from '@astryxdesign/core/Layout'
import { FileInput } from '@astryxdesign/core/FileInput'
import * as XLSX from 'xlsx'
import { parseOrderBuffer } from './orderParse'
import OrdersWorker from './ordersWorker.js?worker&inline'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, LabelList, PieChart, Pie, Cell, Legend, ComposedChart, Line,
} from 'recharts'
import { yearFromFilename, parseSalesClick, parseSalesClickLive, mergeSalesClick, computeClickMetrics, limitedDealCandidates } from './salesClick'

/* ══════════════════ FLEXG API (기존 매출기입 도구와 동일 로직) ══════════════════ */

const BASE = 'https://airgram123.flexgate.co.kr'
const SALES_URL = BASE + '/Account/sales_channel'
const USER_URL = BASE + '/User/list'

const APP = '233,217,211,210,209,203,202,197,196,195,194,193,178,151,146,145,141,140,139,138,137,134,131,130,128,116,115,114,113,112,111,110,96,92,83,82,81,79,76,74,72,55,54,225,224,223,222,221'
const DERA = '218,208,207,206,204,199,182,181,174,172,171,170,168,167,163,162,161,160,159,158,157,156,149,148,144,117,93'
const WATT = '200,192,191,190,189,188'
const GROUP_A = ['0', APP, DERA, WATT].join(',')
const GROUP_B = ['0', APP].join(',')
const ALL_IDXS = ['0', APP, DERA, WATT].join(',')   // 전체 = 채널외 + 앱 + 데라 + 왓트

const CODES = [{"i":"233","n":"APP) PC 상품추천","c":"APP"},{"i":"232","n":"카카오톡_첫자동메시지","c":"기타"},{"i":"231","n":"당근마켓광고","c":"기타"},{"i":"225","n":"APP)앱푸시-시간대별>APP)앱푸시 1","c":"APP"},{"i":"224","n":"APP)앱푸시-시간대별>APP)앱푸시 2","c":"APP"},{"i":"223","n":"APP)앱푸시-시간대별>APP)앱푸시 3","c":"APP"},{"i":"222","n":"APP)앱푸시-시간대별>APP)앱푸시 4","c":"APP"},{"i":"221","n":"APP)앱푸시-시간대별>APP)앱푸시 5","c":"APP"},{"i":"218","n":"APP)데이터라이즈-친구톡(장바구니 연관상품 추천)","c":"APP"},{"i":"217","n":"APP)국탕찜배너","c":"APP"},{"i":"211","n":"APP)히로인스","c":"APP"},{"i":"210","n":"APP)링킷","c":"APP"},{"i":"209","n":"APP) 네비게이션 가정의달","c":"APP"},{"i":"208","n":"APP)데이터라이즈-친구톡(구활 구매연관)","c":"APP"},{"i":"207","n":"APP)데이터라이즈-친구톡(구활 할인)","c":"APP"},{"i":"206","n":"APP)데이터라이즈-친구톡(구활 클릭)","c":"APP"},{"i":"205","n":"밴드AD_국가대표농수산","c":"기타"},{"i":"204","n":"APP)데이터라이즈_알림톡","c":"APP"},{"i":"203","n":"APP) 봄나들이 바로가기 버튼","c":"APP"},{"i":"202","n":"APP)히트상품 배너","c":"APP"},{"i":"200","n":"APP)와이즈트래커친구톡(장바구니 할인알리기)","c":"APP"},{"i":"199","n":"APP)데이터라이즈-친구톡(구매주기이탈률)","c":"APP"},{"i":"197","n":"APP)네비게이션 - 기획전","c":"APP"},{"i":"196","n":"APP)랭킹","c":"APP"},{"i":"195","n":"APP)상단메뉴-간편식","c":"APP"},{"i":"194","n":"APP)기획전카드배너","c":"APP"},{"i":"193","n":"APP)상단메뉴-김치맛집","c":"APP"},{"i":"192","n":"APP)와이즈트래커친구톡(관심상품군)","c":"APP"},{"i":"191","n":"APP)와이즈트래커친구톡(장바구니)","c":"APP"},{"i":"190","n":"APP)와이즈트래커친구톡(검색키워드 연관)","c":"APP"},{"i":"189","n":"APP)와이즈트래커친구톡(주문서작성 이탈)","c":"APP"},{"i":"188","n":"APP)와이즈트래커친구톡(30일 이내 구매한 상품과 비슷한 상품 추천)","c":"APP"},{"i":"187","n":"네이버광고_쇼핑검색","c":"기타"},{"i":"186","n":"크리테오","c":"기타"},{"i":"185","n":"네이버광고_GFA(대행사/애드부스트)","c":"기타"},{"i":"184","n":"네이버광고_GFA(대행사/피드)","c":"기타"},{"i":"183","n":"네이버광고_GFA(애드부스트)","c":"기타"},{"i":"182","n":"APP)데이터라이즈 브랜드메시지","c":"APP"},{"i":"181","n":"APP)데이터라이즈 문자 캠페인(방문-미구매 대상)","c":"APP"},{"i":"180","n":"카카오톡_제철채팅방메뉴3번","c":"기타"},{"i":"179","n":"카카오톡_제철채팅방메뉴2번","c":"기타"},{"i":"178","n":"APP)상단메뉴-설선물세트","c":"APP"},{"i":"177","n":"틱톡_원정대TEST_177","c":"기타"},{"i":"176","n":"틱톡_원정대TEST_176","c":"기타"},{"i":"175","n":"틱톡_원정대TEST_175","c":"기타"},{"i":"174","n":"APP)데이터라이즈 문자 캠페인(장바구니 발송실패 대상)","c":"APP"},{"i":"173","n":"173)인스타그램(광고-클릭후1일)","c":"기타"},{"i":"172","n":"APP)데이터라이즈 문자 캠페인(구활)","c":"APP"},{"i":"171","n":"APP)데이터라이즈 메시지 캠페인(구활)","c":"APP"},{"i":"170","n":"APP)데이터라이즈_친구톡(고이탈군 관심상품 추천)","c":"APP"},{"i":"169","n":"구글_검색캠페인","c":"기타"},{"i":"168","n":"APP)데이터라이즈_친구톡(검색키워드 연관)","c":"APP"},{"i":"167","n":"APP)데이터라이즈_친구톡(주문서작성 이탈)","c":"APP"},{"i":"166","n":"구글_머천트센터","c":"기타"},{"i":"165","n":"메타광고(인스타)_카탈로그","c":"기타"},{"i":"164","n":"카카오톡_전환광고(영상)","c":"기타"},{"i":"163","n":"APP)데이터라이즈_친구톡(첫구매유도)","c":"APP"},{"i":"162","n":"APP)데이터라이즈_친구톡(캐러셀형)","c":"APP"},{"i":"161","n":"APP)데이터라이즈_알림톡(만료 예정쿠폰)","c":"APP"},{"i":"160","n":"APP)데이터라이즈_알림톡(신규 회원가입)","c":"APP"},{"i":"159","n":"APP)데이터라이즈친구톡(고이탈군대상노출많은상품)","c":"APP"},{"i":"158","n":"APP)데이터라이즈친구톡(구매한 상품과 연관있는 상품)","c":"APP"},{"i":"157","n":"APP)데이터라이즈친구톡(관심 상품군)","c":"APP"},{"i":"156","n":"APP)데이터라이즈친구톡(장바구니)","c":"APP"},{"i":"155","n":"네이버광고_검색광고_브랜드검색(모바일)","c":"기타"},{"i":"154","n":"네이버광고_검색광고_브랜드검색(PC)","c":"기타"},{"i":"153","n":"네이버광고_검색광고_제철과일(프로모션)","c":"기타"},{"i":"152","n":"152)인스타광고_리타게팅","c":"기타"},{"i":"151","n":"APP)최상단 배너","c":"APP"},{"i":"149","n":"APP)데이터라이즈 기획전(메세지)","c":"APP"},{"i":"148","n":"APP)데이터라이즈 기획전(온사이트)","c":"APP"},{"i":"147","n":"페이스북(스토리)","c":"기타"},{"i":"146","n":"APP)상단메뉴-제철수산물","c":"APP"},{"i":"145","n":"APP)퀵메뉴 위 배너","c":"APP"},{"i":"144","n":"APP)데이터라이즈 문자 캠페인","c":"APP"},{"i":"143","n":"틱톡_게시물프로모션_소갈비찜-143","c":"기타"},{"i":"142","n":"틱톡_전환광고-142","c":"기타"},{"i":"141","n":"APP)상단메뉴-국탕찜","c":"APP"},{"i":"140","n":"APP)상단메뉴-무료배송","c":"APP"},{"i":"139","n":"APP)상단메뉴-덤증정","c":"APP"},{"i":"138","n":"APP)상단메뉴-전체보기","c":"APP"},{"i":"137","n":"APP) 상단메뉴 태그 배너","c":"APP"},{"i":"136","n":"밴드AD_팔팔농수산","c":"기타"},{"i":"135","n":"구글유튜브_영상매출","c":"기타"},{"i":"134","n":"APP)상세페이지상단","c":"APP"},{"i":"133","n":"모비온_전환광고","c":"기타"},{"i":"131","n":"APP) 오늘의 특가","c":"APP"},{"i":"130","n":"APP) 하루특가","c":"APP"},{"i":"129","n":"틱톡_게시물광고(소갈비찜)-129","c":"기타"},{"i":"128","n":"APP)상세페이지상단배너","c":"APP"},{"i":"127","n":"네이버광고_검색광고_브랜드","c":"기타"},{"i":"126","n":"틱톡_전환광고2-126","c":"기타"},{"i":"125","n":"틱톡_인포크링크-125","c":"기타"},{"i":"124","n":"틱톡_전환광고-124","c":"기타"},{"i":"123","n":"카카오톡_전환광고","c":"기타"},{"i":"122","n":"네이버광고_검색광고_상품","c":"기타"},{"i":"121","n":"카카오톡_제철밥상입니다","c":"기타"},{"i":"120","n":"네이버광고_GFA(피드)","c":"기타"},{"i":"119","n":"밴드AD_어판장삼촌","c":"기타"},{"i":"118","n":"밴드AD_이장님댁며느리","c":"기타"},{"i":"117","n":"APP)데이터라이즈 메시지 캠페인","c":"APP"},{"i":"116","n":"APP)과일배너(제철과일)","c":"APP"},{"i":"115","n":"APP)플렉스지 팝업(화면 중앙)","c":"APP"},{"i":"114","n":"APP)상세페이지최상단배너","c":"APP"},{"i":"113","n":"APP)상단메뉴(기획전위)","c":"APP"},{"i":"112","n":"APP)간편식배너","c":"APP"},{"i":"111","n":"APP)타임세일","c":"APP"},{"i":"110","n":"APP)앱푸시","c":"APP"},{"i":"108","n":"구글애즈광고(P-max)","c":"기타"},{"i":"107","n":"구글애즈광고(디스플레이)","c":"기타"},{"i":"106","n":"구글애즈광고(P-max-테스트)","c":"기타"},{"i":"105","n":"105)메타(인스타)광고-페이스북)","c":"기타"},{"i":"104","n":"104)인스타그램_게시물광고","c":"기타"},{"i":"102","n":"구글애즈광고_(디멘드젠)","c":"기타"},{"i":"101","n":"카카오톡_B채널","c":"기타"},{"i":"100","n":"카카오톡_A채널","c":"기타"},{"i":"99","n":"카카오톡_우리농부로부터","c":"기타"},{"i":"98","n":"인스타그램-릴스","c":"기타"},{"i":"97","n":"인스타그램-스레드","c":"기타"},{"i":"96","n":"APP)퀵메뉴","c":"APP"},{"i":"93","n":"APP)데이터라이즈팝업(화면하단)","c":"APP"},{"i":"92","n":"APP)탭메뉴(하단카테고리)","c":"APP"},{"i":"91","n":"인스타그램(shop)","c":"기타"},{"i":"90","n":"카카오스토리 D채널","c":"기타"},{"i":"89","n":"카카오스토리 C채널","c":"기타"},{"i":"88","n":"카카오스토리 B채널","c":"기타"},{"i":"87","n":"카카오스토리 A채널","c":"기타"},{"i":"84","n":"카카오톡_제철밥상농부","c":"기타"},{"i":"83","n":"APP)김치배너","c":"APP"},{"i":"82","n":"APP)떡배너","c":"APP"},{"i":"81","n":"APP)수산물배너","c":"APP"},{"i":"79","n":"APP)축산물배너","c":"APP"},{"i":"76","n":"APP)반찬배너","c":"APP"},{"i":"74","n":"APP)신상품배너","c":"APP"},{"i":"72","n":"APP)농산물배너(당일수확)","c":"APP"},{"i":"71","n":"카카오톡_구매전환광고","c":"기타"},{"i":"70","n":"밴드AD_백년농수산","c":"기타"},{"i":"69","n":"밴드AD_제철농수산","c":"기타"},{"i":"67","n":"카카오톡_산지농부들","c":"기타"},{"i":"65","n":"밴드AD_산지농산물","c":"기타"},{"i":"62","n":"밴드AD_약이되는제철밥상","c":"기타"},{"i":"61","n":"페이스북(게시물)","c":"기타"},{"i":"58","n":"밴드AD_산지농부들","c":"기타"},{"i":"57","n":"밴드AD_우리동네농부들","c":"기타"},{"i":"55","n":"APP)단골추천","c":"APP"},{"i":"54","n":"APP)기획전배너","c":"APP"},{"i":"53","n":"오픈채팅방_CS팀관리","c":"기타"},{"i":"52","n":"인스타그램(인포크링크-알림톡)","c":"기타"},{"i":"50","n":"카카오스토리 판매","c":"기타"},{"i":"45","n":"45)인스타그램(광고-인스타그램/페이스북)","c":"기타"},{"i":"44","n":"인스타그램(인포크링크)","c":"기타"},{"i":"6","n":"카카오톡_남성톡채널","c":"기타"},{"i":"1","n":"카카오톡_여성톡채널","c":"기타"},{"i":"0","n":"채널 외 (직접 유입)","c":"기타"}]
const CODE_CATS = ['전체', ...[...new Set(CODES.map((c) => c.c))]]
const codeName = (i) => CODES.find((c) => c.i === i)?.n || `코드 ${i}`

const WEEKLY_GROUPS = [
  { name: '밴드A',        idxs: '118,69,62,58' },
  { name: '밴드B',        idxs: '136,70,65,57' },
  { name: '카카오스토리', idxs: '90,89,88,87,50' },
  { name: '카카오톡',     idxs: '232,180,179,121,101,100,99,84,67,6,1' },
  { name: '카톡광고',     idxs: '164,123,71' },
  { name: '앱(푸시제외)', idxs: '0,233,218,217,211,210,209,208,207,206,204,203,202,200,199,197,196,195,194,193,192,191,190,189,188,182,181,178,174,172,171,170,168,167,163,162,161,160,159,158,157,156,151,149,148,146,145,144,141,140,139,138,137,134,131,130,128,117,116,115,114,113,112,111,110,96,93,92,83,82,81,79,76,74,72,55,54' },
  { name: '앱푸시',       idxs: '221,222,223,224,225' },
  { name: '인스타그램',   idxs: '98,97,91,52,44' },
  { name: 'SNS광고',      idxs: '173,165,152,133,105,104,45' },
  { name: '페이스북',     idxs: '147,61' },
  { name: '틱톡',         idxs: '177,176,175,143,142,129,126,125,124' },
  { name: '일반광고',     idxs: '231,187,186,185,184,183,169,166,155,154,153,135,127,122,120,108,107,106,102' },
]

const MODES = [
  { value: 'total',   label: '전체 매출' },
  { value: 'groupA',  label: '앱+데라+왓츠 (채널외 포함)' },
  { value: 'groupB',  label: '앱 · 푸시제외 (채널외 포함)' },
  { value: 'compare', label: '채널 그룹 비교 (직접 선택)' },
  { value: 'custom',  label: '추적코드 직접 선택' },
]

const numOf = (s) => Number(String(s).replace(/[^0-9-]/g, '')) || 0
const EXCLUDE_STATUS = /취소|휴지통|미입금/
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function salesUrl(from, to, idxs, keyword = '') {
  return `${SALES_URL}?gubun=DAY&date_flag=custom&date_from=${from}&date_to=${to}&payment_method=&mg_fee=&order_status=&payment_mode=Y&ch_idx=&keyword=${encodeURIComponent(keyword)}&search=mg_code&sort_type=payment&channel_names=&channel_idxs=${idxs}&vat=I`
}

function cellsOf(seg) {
  const cells = []
  const re = /<td([^>]*)>([\s\S]*?)<\/td>/g
  let m
  while ((m = re.exec(seg))) cells.push({ cls: m[1] || '', txt: m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() })
  return cells
}

// 채널 조회: summary 소계 + 추적코드별 개별 행 파싱
// (point9=정상금액, 다음 셀=결제건수, 마지막=판매이익 — 개별 행은 소계와 같은 컬럼 구조)
const PARENT_CODE_ROWS = new Set(['APP)앱푸시-시간대별'])

async function fetchSalesSummary(from, to, idxs, keyword = '') {
  const html = await (await fetch(salesUrl(from, to, idxs, keyword), { credentials: 'include' })).text()
  const si = html.indexOf('class="summary')
  if (si < 0) return { cnt: 0, amt: 0, profit: 0, rows: [] }

  // 소계
  const sumSeg = html.slice(si, html.indexOf('</tr>', si))
  const sumCells = cellsOf(sumSeg)
  const p9i = sumCells.findIndex((c) => c.cls.indexOf('point9') >= 0)
  const summary = {
    amt: p9i >= 0 ? numOf(sumCells[p9i].txt) : 0,
    cnt: p9i >= 0 && sumCells[p9i + 1] ? numOf(sumCells[p9i + 1].txt) : 0,
    profit: numOf(sumCells[sumCells.length - 1]?.txt),
  }

  // 추적코드별 행: 소계가 속한 테이블 안의 나머지 <tr>
  const rows = []
  const tblStart = html.lastIndexOf('<table', si)
  const tblEnd = html.indexOf('</table>', si)
  if (tblStart >= 0 && tblEnd > tblStart) {
    const tbl = html.slice(tblStart, tblEnd)
    const trRe = /<tr([^>]*)>([\s\S]*?)<\/tr>/g
    let t
    while ((t = trRe.exec(tbl))) {
      if ((t[1] || '').indexOf('summary') >= 0) continue // 소계 제외
      const cells = cellsOf(t[2])
      if (cells.length < 5) continue // 헤더/빈 행
      // 행 내 point9 우선, 없으면 소계의 컬럼 위치 재사용
      let pi = cells.findIndex((c) => c.cls.indexOf('point9') >= 0)
      if (pi < 0) pi = p9i
      if (pi < 0 || !cells[pi]) continue
      const amt = numOf(cells[pi].txt)
      const cnt = cells[pi + 1] ? numOf(cells[pi + 1].txt) : 0
      const profit = numOf(cells[cells.length - 1].txt)
      // 채널명 = 숫자가 아닌 첫 텍스트 셀
      const nameCell = cells.find((c) => c.txt && !/^[\d,.\-\s%원]+$/.test(c.txt))
      if (!nameCell) continue
      if (amt === 0 && cnt === 0) continue
      if (PARENT_CODE_ROWS.has(nameCell.txt.trim())) continue
      rows.push({ name: nameCell.txt, amt, cnt, profit })
    }
  }
  rows.sort((a, b) => b.amt - a.amt)
  return { ...summary, rows }
}

// 전체 조회: 일별 리스트 소계행 trcolorline (c[6]=결제건수, c[9]=정상금액, c[13]=판매이익)
async function fetchTotalDaily(from, to) {
  const html = await (await fetch(salesUrl(from, to, ''), { credentials: 'include' })).text()
  const idx = html.indexOf('trcolorline')
  if (idx < 0) return { cnt: 0, amt: 0, profit: 0, rows: [] }
  const seg = html.slice(html.lastIndexOf('<tr', idx), html.indexOf('</tr>', idx))
  const c = cellsOf(seg).map((x) => x.txt)
  if (c.length < 14) return { cnt: 0, amt: 0, profit: 0, rows: [] }
  return { cnt: numOf(c[6]), amt: numOf(c[9]), profit: numOf(c[13]), rows: [] }
}

// 회원 수: 가입일 필터로 조회, "전체 N" 카운트 파싱
async function fetchMembers(from, to) {
  let u = `${USER_URL}?sc_id=&sc_name=&sc_status=0&sc_email=&sc_tel=&sort=sc_idx&pagesize=100&userClasses=&sc_types=&userDivision=%2C&birthDay_from=&birthDay_to=&gender=&marketing_agree=&fs_name=&userFandom=&page=1&date_to=${to}`
  if (from) u += `&date_from=${from}`
  const html = await (await fetch(u, { credentials: 'include' })).text()
  const m = html.match(/전체\s*<[^>]*>\s*([\d,]+)/)
  return m ? numOf(m[1]) : 0
}

/* ══════════════════ 유틸 ══════════════════ */

const won = (n) => (n ?? 0).toLocaleString('ko-KR') + '원'
const manwon = (n) => Math.round(n / 10000).toLocaleString('ko-KR') + '만'
const comma = (n) => (n ?? 0).toLocaleString('ko-KR')
const DOW = ['일', '월', '화', '수', '목', '금', '토']

function* eachDay(from, to) {
  const d = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (d <= end) {
    yield d.toISOString().slice(0, 10)
    d.setDate(d.getDate() + 1)
  }
}
const dayCount = (from, to) => [...eachDay(from, to)].length
const dayLabel = (isoStr) => `${isoStr.slice(5, 10)} (${DOW[new Date(isoStr + 'T00:00:00').getDay()]})`

const iso = (d) => d.toISOString().slice(0, 10)
function shiftDays(isoStr, n) {
  const d = new Date(isoStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return iso(d)
}
function lastWeekRange() {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7
  const monThis = new Date(now); monThis.setDate(now.getDate() - dow)
  const mon = new Date(monThis); mon.setDate(monThis.getDate() - 7)
  const sun = new Date(monThis); sun.setDate(monThis.getDate() - 1)
  return { start: iso(mon), end: iso(sun) }
}
const PRESETS = [
  { label: '지난주 (월–일)', getRange: lastWeekRange },
  { label: '최근 7일', getRange: () => { const e = new Date(); e.setDate(e.getDate() - 1); const s = new Date(e); s.setDate(e.getDate() - 6); return { start: iso(s), end: iso(e) } } },
  { label: '이번 달', getRange: () => { const n = new Date(); return { start: iso(new Date(n.getFullYear(), n.getMonth(), 1, 12)), end: iso(n) } } },
  { label: '지난 달', getRange: () => { const n = new Date(); return { start: iso(new Date(n.getFullYear(), n.getMonth() - 1, 1, 12)), end: iso(new Date(n.getFullYear(), n.getMonth(), 0, 12)) } } },
]

/* ══════════════════ 공용 뷰 조각 ══════════════════ */

// 카드를 PNG로 클립보드에 복사하는 래퍼
function SnapCard({ children, padding = 3 }) {
  const ref = useRef(null)
  const [state, setState] = useState(null) // null | 'ok' | 'fail'
  const copy = async () => {
    try {
      const blob = await toBlob(ref.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter: (el) => !(el.classList && el.classList.contains('snap-btn')),
      })
      if (!blob) throw new Error('capture fail')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setState('ok')
    } catch {
      // 클립보드 실패 시 PNG 다운로드 폴백
      try {
        const blob = await toBlob(ref.current, { pixelRatio: 2, backgroundColor: '#ffffff',
          filter: (el) => !(el.classList && el.classList.contains('snap-btn')) })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'card.png'
        a.click()
        setState('ok')
      } catch { setState('fail') }
    }
    setTimeout(() => setState(null), 1600)
  }
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Card padding={padding}>{children}</Card>
      <button className="snap-btn no-print" onClick={copy}
              title="이 영역을 이미지로 복사"
              style={{
                position: 'absolute', top: 10, right: 10, zIndex: 5,
                width: 26, height: 26, borderRadius: 6, border: '1px solid var(--color-border)',
                background: 'var(--color-background-card)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: state === 'ok' ? '#1c4f3a' : state === 'fail' ? '#b3261e' : 'var(--color-text-secondary)',
                opacity: 0.85,
              }}>
        {state === 'ok' ? '✓' : state === 'fail' ? '!' : '⧉'}
      </button>
    </div>
  )
}

function Kpi({ label, value, sub, badge }) {
  return (
    <SnapCard>
      <Stack gap={1}>
        <Text type="supporting" color="secondary">{label}</Text>
        <Text type="display-3" weight="bold">{value}</Text>
        {badge || (sub ? <Text type="supporting" color="secondary">{sub}</Text> : null)}
      </Stack>
    </SnapCard>
  )
}

function ChartTip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-background-card)', border: '1px solid var(--color-border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
      boxShadow: '0 2px 8px rgba(0,0,0,.1)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {payload.map((p) => <div key={p.dataKey}>{(fmt || won)(p.value)}</div>)}
    </div>
  )
}

function ProgressBar({ done, total, msg }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <Card padding={4}>
      <Stack gap={2}>
        <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
          <Text type="display-3" weight="bold">{pct}%</Text>
          <Stack gap={0.5}>
            <Text weight="semibold">데이터 조회 중… ({done}/{total})</Text>
            <Text type="supporting" color="secondary">{msg}</Text>
          </Stack>
        </Stack>
        <div style={{ height: 10, borderRadius: 5, background: 'var(--color-background-muted, #e8e6e0)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: pct + '%', borderRadius: 5,
            background: 'var(--ch-app, #1c4f3a)', transition: 'width .25s ease',
          }} />
        </div>
      </Stack>
    </Card>
  )
}

function DailyBarCard({ title, data, dataKey, fmt, color }) {
  return (
    <SnapCard>
      <Stack gap={2}>
        <Text type="label" weight="semibold">{title}</Text>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={56} />
            <RTooltip content={<ChartTip fmt={fmt === manwon ? won : fmt} />} cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </Stack>
    </SnapCard>
  )
}

// 표 셀용 A/B 변동 배지 — B가 없거나 0이면 상태 배지
export function DeltaCellBadge({ cur, prev }) {
  if (prev == null) return '–'
  if (!prev) return cur ? <Badge variant="neutral" label="B 없음" /> : '–'
  const d = (cur - prev) / prev
  return <Badge variant={d >= 0 ? 'success' : 'error'} label={`${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}%`} />
}

function DeltaBadge({ cur, prev, label = '직전 기간 대비' }) {
  if (prev == null || prev === 0) return null
  const d = (cur - prev) / prev
  return (
    <Badge
      variant={d >= 0 ? 'success' : 'error'}
      label={`${label} ${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}%`}
    />
  )
}

/* ══════════════════ 기간 비교 카드 (지표 다중 선택 + 막대/도넛) ══════════════════ */

const CMP_A = 'var(--ch-app, #1c4f3a)'
const CMP_B = 'var(--ch-kakao, #e6b422)'
const METRICS = [
  { value: 'amt',    label: '정상금액', fmt: won, axis: manwon },
  { value: 'cnt',    label: '결제건수', fmt: (n) => comma(n) + '건', axis: comma },
  { value: 'profit', label: '판매이익', fmt: won, axis: manwon },
  { value: 'aov',    label: '객단가',   fmt: won, axis: manwon },
]
const metricOf = (s, key) => key === 'aov' ? (s.cnt ? Math.round(s.amt / s.cnt) : 0) : (s[key] ?? 0)

function MetricMiniChart({ metric, chart, periodA, periodB }) {
  const M = METRICS.find((m) => m.value === metric)
  const rows = [
    { name: '기간 A', value: metricOf(periodA.summary, metric), fill: CMP_A },
    { name: '기간 B', value: metricOf(periodB.summary, metric), fill: CMP_B },
  ]
  const diff = rows[1].value ? (rows[0].value - rows[1].value) / rows[1].value : null

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: 14 }}>
      <Stack gap={1}>
        <Stack direction="horizontal" gap={2} vAlign="center">
          <Text type="label" weight="semibold">{M.label}</Text>
          {diff != null && (
            <Badge variant={diff >= 0 ? 'success' : 'error'}
                   label={`${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)}%`} />
          )}
        </Stack>
        <Text type="supporting" color="secondary">A {M.fmt(rows[0].value)} · B {M.fmt(rows[1].value)}</Text>
        {chart === 'bar' ? (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={rows} margin={{ top: 20, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={M.axis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={46} />
              <RTooltip content={<ChartTip fmt={M.fmt} />} cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {rows.map((r) => <Cell key={r.name} fill={r.fill} />)}
                <LabelList dataKey="value" position="top" formatter={M.axis}
                           style={{ fontSize: 11, fontWeight: 600, fill: 'var(--color-text-primary)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={rows} dataKey="value" nameKey="name" innerRadius={40} outerRadius={64}
                   paddingAngle={2} strokeWidth={0}>
                {rows.map((r) => <Cell key={r.name} fill={r.fill} />)}
              </Pie>
              <RTooltip formatter={(v, n) => [M.fmt(v), n]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Stack>
    </div>
  )
}

function PeriodCompareCard({ periodA, periodB }) {
  const [metrics, setMetrics] = useState(['amt', 'cnt'])
  const [chart, setChart] = useState('bar')

  return (
    <Card padding={3}>
      <Stack gap={2}>
        <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
          <Text type="label" weight="semibold">기간 비교</Text>
          <div style={{ flex: 1 }} />
          <div style={{ minWidth: 210 }}>
            <MultiSelector label="지표 (여러 개 선택)"
                           options={METRICS.map((m) => ({ value: m.value, label: m.label }))}
                           value={metrics} onChange={setMetrics} hasSelectAll />
          </div>
          <TabList value={chart} onChange={setChart} size="sm">
            <Tab value="bar" label="막대" />
            <Tab value="donut" label="도넛" />
          </TabList>
        </Stack>

        <Stack direction="horizontal" gap={4} wrap="wrap">
          <Stack direction="horizontal" gap={1.5} vAlign="center">
            <span style={{ width: 10, height: 10, borderRadius: 5, background: CMP_A, display: 'inline-block' }} />
            <Text type="supporting" color="secondary">기간 A · {periodA.label}</Text>
          </Stack>
          <Stack direction="horizontal" gap={1.5} vAlign="center">
            <span style={{ width: 10, height: 10, borderRadius: 5, background: CMP_B, display: 'inline-block' }} />
            <Text type="supporting" color="secondary">기간 B · {periodB.label}</Text>
          </Stack>
        </Stack>

        {metrics.length === 0 ? (
          <Text color="secondary">지표를 하나 이상 선택해주세요.</Text>
        ) : (
          <Grid columns={{ minWidth: 240, repeat: 'fit' }} gap={3}>
            {METRICS.filter((m) => metrics.includes(m.value)).map((m) => (
              <MetricMiniChart key={m.value} metric={m.value} chart={chart}
                               periodA={periodA} periodB={periodB} />
            ))}
          </Grid>
        )}
      </Stack>
    </Card>
  )
}

function DailyCompareTip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-background-card)', border: '1px solid var(--color-border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
      boxShadow: '0 2px 8px rgba(0,0,0,.1)',
    }}>
      {payload.map((p) => {
        const d = p.dataKey === 'A' ? p.payload.Adate : p.payload.Bdate
        return <div key={p.dataKey} style={{ color: p.fill }}>기간 {p.dataKey} {d ? `(${d})` : ''}: {won(p.value)}</div>
      })}
    </div>
  )
}

/* ══════════════════ 추적코드별 상세 ══════════════════ */

function TrackingCodesCard({ rowsA, rowsB, cmp }) {
  const [showAll, setShowAll] = useState(false)
  const merged = rowsA.map((r) => {
    const b = cmp ? rowsB.find((x) => x.name === r.name) : null
    return { ...r, amtB: b?.amt ?? null, cntB: b?.cnt ?? null }
  })
  // B에만 있는 코드도 포함
  if (cmp) {
    rowsB.forEach((b) => {
      if (!merged.find((m) => m.name === b.name)) {
        merged.push({ name: b.name, amt: 0, cnt: 0, profit: 0, amtB: b.amt, cntB: b.cnt })
      }
    })
  }
  const data = showAll ? merged : merged.slice(0, 15)

  const cols = [
    { key: 'name', header: '추적코드 / 채널' },
    { key: 'amt', header: cmp ? '정상금액 (A)' : '정상금액', renderCell: (r) => won(r.amt) },
    { key: 'cnt', header: cmp ? '결제건수 (A)' : '결제건수', renderCell: (r) => comma(r.cnt) },
  ]
  if (cmp) {
    cols.push(
      { key: 'amtB', header: '정상금액 (B)', renderCell: (r) => r.amtB == null ? '–' : won(r.amtB) },
      { key: 'delta', header: '변동 (금액)', renderCell: (r) => {
          if (!r.amtB) return <Badge variant="neutral" label={r.amt ? 'B 없음' : '–'} />
          const d = (r.amt - r.amtB) / r.amtB
          return <Badge variant={d >= 0 ? 'success' : 'error'} label={`${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}%`} />
        } },
    )
  } else {
    cols.push({ key: 'profit', header: '판매이익', renderCell: (r) => won(r.profit) })
  }

  return (
    <SnapCard>
      <Stack gap={2}>
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          <Text type="label" weight="semibold">추적코드별 상세</Text>
          <Text type="supporting" color="secondary">
            {cmp ? '기간 A/B 코드별 변동 · 금액 순' : '조회 기간 내 코드별 실적 · 금액 순'}
          </Text>
          <div style={{ flex: 1 }} />
          {merged.length > 15 && (
            <Button label={showAll ? '상위 15개만' : `전체 보기 (${merged.length}개)`}
                    variant="ghost" size="sm" clickAction={() => setShowAll(!showAll)} />
          )}
        </Stack>
        <Table data={data} idKey="name" density="compact" dividers="rows" columns={cols} />
      </Stack>
    </SnapCard>
  )
}

/* ══════════════════ 매출 섹션 ══════════════════ */

function SalesSection() {
  const [salesTab, setSalesTab] = useState('ch')   // 'ch' 채널별 | 'prod' 상품별
  const [prodCodesText, setProdCodesText] = useState('')
  const [prodBusy, setProdBusy] = useState(false)
  const [prodProg, setProdProg] = useState({ msg: '', done: 0, total: 0 })
  const [resProd, setResProdRaw] = useState(() => restoredOf('salesProd'))
  const setResProd = (v) => { setResProdRaw(v); if (v) registerSnap('salesProd', v) }
  const [prodSort, setProdSort] = useState([])
  const prodSortPlugin = useTableSortable({ sort: prodSort, onSortChange: setProdSort })
  const [selProdCode, setSelProdCode] = useState(null)
  const [range, setRange] = useState(lastWeekRange())
  const [cmpOn, setCmpOn] = useState(false)
  const [cmpRange, setCmpRange] = useState(null)
  const [mode, setMode] = useState('total')
  const [groups, setGroups] = useState(['밴드A', '밴드B', '카카오톡', '앱(푸시제외)'])
  const [codeCat, setCodeCat] = useState('전체')
  const [codeSel, setCodeSel] = useState([])
  const [withDaily, setWithDaily] = useState(true)

  const [busy, setBusy] = useState(false)
  const [prog, setProg] = useState({ msg: '', done: 0, total: 0 })
  const [error, setError] = useState(null)
  const [res, setResRaw] = useState(() => restoredOf('sales'))
  const setRes = (v) => { setResRaw(v); if (v) registerSnap('sales', v) }

  const isCompareMode = mode === 'compare'
  const isCustomMode = mode === 'custom'
  const cmpActive = cmpOn && !isCompareMode

  function addCmp() {
    if (!cmpRange && range?.start && range?.end) {
      const n = dayCount(range.start, range.end)
      setCmpRange({ start: shiftDays(range.start, -n), end: shiftDays(range.end, -n) })
    }
    setCmpOn(true)
  }

  async function load() {
    if (!range?.start || !range?.end) { setError('기간을 선택해주세요.'); return }
    const { start: from, end: to } = range
    const nDays = dayCount(from, to)
    if (nDays > 62) { setError('기간이 62일을 넘어요. 나눠서 조회해주세요.'); return }
    if (cmpActive && (!cmpRange?.start || !cmpRange?.end)) { setError('비교군 기간을 선택해주세요.'); return }
    const nDaysB = cmpActive ? dayCount(cmpRange.start, cmpRange.end) : 0
    if (nDaysB > 62) { setError('비교군 기간이 62일을 넘어요.'); return }

    const selGroups = isCompareMode ? WEEKLY_GROUPS.filter((g) => groups.includes(g.name)) : []
    if (isCompareMode && selGroups.length === 0) { setError('비교할 채널 그룹을 하나 이상 선택해주세요.'); return }
    if (isCustomMode && codeSel.length === 0) { setError('추적코드를 하나 이상 선택해주세요.'); return }

    // 전체 요청 수 미리 계산 → 진행도 표시
    const total = 2 + selGroups.length + (withDaily ? nDays + (cmpActive ? nDaysB : 0) : 0)
    let done = 0
    const step = (msg) => { setProg({ msg, done, total }) }
    const tick = () => { done++; setProg((p) => ({ ...p, done })) }

    setBusy(true); setError(null); setRes(null)
    try {
      const modeIdxs = mode === 'groupA' ? GROUP_A : mode === 'groupB' ? GROUP_B : ''
      const unionIdxs = isCompareMode
        ? [...new Set(selGroups.flatMap((g) => g.idxs.split(',')))].join(',')
        : isCustomMode ? codeSel.join(',') : modeIdxs
      const fetchPeriod = (f, t) => mode === 'total' ? fetchTotalDaily(f, t) : fetchSalesSummary(f, t, unionIdxs)

      step('기간 A 합계 조회 중…')
      const summary = await fetchPeriod(from, to)
      tick(); await sleep(250)

      step(cmpActive ? '기간 B(비교군) 합계 조회 중…' : '직전 기간 조회 중…')
      const summaryB = cmpActive
        ? await fetchPeriod(cmpRange.start, cmpRange.end)
        : await fetchPeriod(shiftDays(from, -nDays), shiftDays(to, -nDays))
      tick(); await sleep(250)

      const compare = []
      for (let i = 0; i < selGroups.length; i++) {
        step(`채널 그룹 조회 중… ${selGroups[i].name}`)
        const r = await fetchSalesSummary(from, to, selGroups[i].idxs)
        compare.push({ name: selGroups[i].name, ...r })
        tick(); await sleep(250)
      }
      compare.sort((a, b) => b.amt - a.amt)

      const daily = []
      const dailyB = []
      if (withDaily) {
        for (const d of eachDay(from, to)) {
          step(`기간 A 일별 조회 중… ${d}`)
          const r = await fetchPeriod(d, d)
          daily.push({ day: dayLabel(d), date: d, amt: r.amt, cnt: r.cnt, profit: r.profit })
          tick(); await sleep(250)
        }
        if (cmpActive) {
          for (const d of eachDay(cmpRange.start, cmpRange.end)) {
            step(`기간 B 일별 조회 중… ${d}`)
            const r = await fetchPeriod(d, d)
            dailyB.push({ date: d, amt: r.amt, cnt: r.cnt, profit: r.profit })
            tick(); await sleep(250)
          }
        }
      }

      setRes({
        summary, summaryB, daily, dailyB, compare,
        mode,
        cmp: cmpActive,
        labelA: `${from} ~ ${to} (${nDays}일)`,
        labelB: cmpActive ? `${cmpRange.start} ~ ${cmpRange.end} (${nDaysB}일)` : null,
        modeLabel: isCompareMode
          ? `채널 비교: ${selGroups.map((g) => g.name).join(', ')}`
          : isCustomMode
          ? `추적코드 ${codeSel.length}개: ${codeSel.slice(0, 3).map(codeName).join(', ')}${codeSel.length > 3 ? ' 외' : ''}`
          : MODES.find((m) => m.value === mode)?.label,
      })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  // 상품별 매출 조회 — 코드당 요청 1회(비교 시 2회) · 채널 구성은 채널별과 공유
  async function loadProducts() {
    const codes = parseCodes(prodCodesText)
    if (!codes.length) { setError('상품코드를 하나 이상 입력해주세요. (예: SAI56159818)'); return }
    if (codes.length > 30) { setError(`상품코드가 ${codes.length}개예요 — 30개 이하로 줄여주세요. (요청 폭주 방지)`); return }
    if (!range?.start || !range?.end) { setError('기간을 선택해주세요.'); return }
    if (cmpActive && (!cmpRange?.start || !cmpRange?.end)) { setError('비교군 기간을 선택해주세요.'); return }

    const selGroups = isCompareMode ? WEEKLY_GROUPS.filter((g) => groups.includes(g.name)) : []
    const idxs = isCompareMode
      ? [...new Set(selGroups.flatMap((g) => g.idxs.split(',')))].join(',')
      : isCustomMode ? codeSel.join(',')
      : mode === 'groupA' ? GROUP_A : mode === 'groupB' ? GROUP_B : ALL_IDXS
    if (isCustomMode && !codeSel.length) { setError('커스텀 모드예요 — 추적코드를 선택하거나 채널을 바꿔주세요.'); return }

    const total = codes.length * (cmpActive ? 2 : 1)
    let done = 0
    const tick = (msg) => { done++; setProdProg({ msg, done, total }) }
    setProdBusy(true); setError(null); setResProd(null)
    setProdProg({ msg: '', done: 0, total })
    try {
      const rows = []
      for (const code of codes) {
        setProdProg((p) => ({ ...p, msg: `기간 A 조회 중… ${code}` }))
        const A = await fetchSalesSummary(range.start, range.end, idxs, code)
        tick(code); await sleep(250)
        let B = null
        if (cmpActive) {
          setProdProg((p) => ({ ...p, msg: `기간 B 조회 중… ${code}` }))
          B = await fetchSalesSummary(cmpRange.start, cmpRange.end, idxs, code)
          tick(code); await sleep(250)
        }
        rows.push({ name: code, amt: A.amt, cnt: A.cnt, profit: A.profit,
                    amtB: B?.amt ?? null, cntB: B?.cnt ?? null, profitB: B?.profit ?? null,
                    channels: A.rows || [] })
      }
      rows.sort((x, y) => y.amt - x.amt)
      const sum = (k) => rows.reduce((s2, r) => s2 + (r[k] || 0), 0)
      setResProd({
        rows, cmp: cmpActive,
        totals: { amt: sum('amt'), cnt: sum('cnt'), profit: sum('profit'),
                  amtB: cmpActive ? sum('amtB') : null, cntB: cmpActive ? sum('cntB') : null },
        labelA: `${range.start} ~ ${range.end}`,
        labelB: cmpActive ? `${cmpRange.start} ~ ${cmpRange.end}` : null,
        modeLabel: isCompareMode ? `채널 그룹: ${selGroups.map((g) => g.name).join(', ')}`
          : isCustomMode ? `추적코드 ${codeSel.length}개`
          : mode === 'groupA' ? '앱+데라+왓츠' : mode === 'groupB' ? '앱 · 푸시제외' : '전체 채널',
      })
    } catch (e) { setError(e.message || String(e)) }
    finally { setProdBusy(false) }
  }

  const s = res?.summary
  const aov = s?.cnt ? Math.round(s.amt / s.cnt) : 0
  const deltaLabel = res?.cmp ? '비교 기간 대비' : '직전 기간 대비'

  const dailyMerged = res && res.cmp && res.daily.length
    ? Array.from({ length: Math.max(res.daily.length, res.dailyB.length) }, (_, i) => ({
        idx: `${i + 1}일차`,
        A: res.daily[i]?.amt, Adate: res.daily[i]?.date,
        B: res.dailyB[i]?.amt, Bdate: res.dailyB[i]?.date,
      }))
    : null

  return (
    <Stack gap={4}>
      <TabList value={salesTab} onChange={setSalesTab}>
        <Tab value="ch" label="📡 채널별" />
        <Tab value="prod" label="📦 상품별" />
      </TabList>

      <div style={{ display: salesTab === 'ch' ? 'contents' : 'none' }}>
{!VIEWER && (<>
      <Card padding={3}>
        <Stack gap={3}>
          <Stack direction="horizontal" gap={3} vAlign="end" wrap="wrap">
            <DateRangeInput label={cmpActive ? '조회 기간 (A)' : '조회 기간'} value={range} onChange={setRange} presets={PRESETS} />
            {cmpActive ? (
              <>
                <DateRangeInput label="비교군 기간 (B)" value={cmpRange} onChange={setCmpRange} presets={PRESETS} />
                <Button label="비교군 제거" variant="ghost" clickAction={() => setCmpOn(false)} />
              </>
            ) : (
              !isCompareMode && <Button label="+ 비교군 추가" variant="secondary" clickAction={addCmp} />
            )}
            <div style={{ minWidth: 240 }}>
              <Selector label="채널" options={MODES} value={mode} onChange={setMode} />
            </div>
            {isCompareMode && (
              <div style={{ minWidth: 260 }}>
                <MultiSelector
                  label="비교할 채널 그룹"
                  options={WEEKLY_GROUPS.map((g) => g.name)}
                  value={groups}
                  onChange={setGroups}
                  hasSelectAll
                />
              </div>
            )}
            {isCustomMode && (
              <>
                <div style={{ minWidth: 130 }}>
                  <Selector label="분류" options={CODE_CATS} value={codeCat} onChange={setCodeCat} />
                </div>
                <div style={{ minWidth: 320 }}>
                  <MultiSelector
                    label={`추적코드 (${codeSel.length}개 선택됨)`}
                    options={CODES.filter((c) => codeCat === '전체' || c.c === codeCat)
                      .map((c) => ({ value: c.i, label: `${c.n} (${c.i})` }))}
                    value={codeSel}
                    onChange={setCodeSel}
                    hasSelectAll
                    hasSearch
                    searchPlaceholder="이름 또는 코드번호로 검색…"
                  />
                </div>
              </>
            )}
          </Stack>
          {isCompareMode && cmpOn && (
            <Text type="supporting" color="secondary">채널 그룹 비교 모드에서는 기간 비교를 사용할 수 없어요. 다른 채널 모드로 바꾸면 비교군이 다시 나타나요.</Text>
          )}
          <Stack direction="horizontal" gap={4} vAlign="center" wrap="wrap">
            <Switch label="일별 추이 조회 (하루당 요청 1회)" value={withDaily} onChange={setWithDaily} />
            <Button label={busy ? '조회 중…' : '매출 불러오기'} variant="primary" isDisabled={busy} clickAction={load} />
          </Stack>
        </Stack>
      </Card>
</>)}

      {busy && <ProgressBar done={prog.done} total={prog.total} msg={prog.msg} />}
      {error && <Banner status="error" title="조회 실패" description={error} />}

      {res && (
        <>
          <Stack gap={0.5}>
            <Text type="label" weight="semibold">
              {res.cmp ? `A: ${res.labelA}  ·  B: ${res.labelB}` : res.labelA}
            </Text>
            <Text type="supporting" color="secondary">{res.modeLabel}</Text>
          </Stack>

          <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={3}>
            <Kpi label="정상금액" value={won(s.amt)} badge={<DeltaBadge cur={s.amt} prev={res.summaryB?.amt} label={deltaLabel} />} />
            <Kpi label="결제건수" value={comma(s.cnt) + '건'} badge={<DeltaBadge cur={s.cnt} prev={res.summaryB?.cnt} label={deltaLabel} />} />
            <Kpi label="객단가" value={won(aov)} sub="정상금액 ÷ 결제건수" />
            <Kpi label="판매이익" value={won(s.profit)} badge={<DeltaBadge cur={s.profit} prev={res.summaryB?.profit} label={deltaLabel} />} />
          </Grid>

          {res.cmp && res.summaryB && (
            <PeriodCompareCard
              periodA={{ label: res.labelA, summary: res.summary }}
              periodB={{ label: res.labelB, summary: res.summaryB }}
            />
          )}

          {dailyMerged ? (
            <SnapCard>
              <Stack gap={2}>
                <Text type="label" weight="semibold">일별 정상금액 비교 (n일차 기준)</Text>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dailyMerged} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="idx" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={manwon} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={56} />
                    <RTooltip content={<DailyCompareTip />} cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
                    <Legend iconType="circle" iconSize={9}
                            formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v === 'A' ? '기간 A' : '기간 B'}</span>} />
                    <Bar dataKey="A" fill={CMP_A} radius={[3, 3, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="B" fill={CMP_B} radius={[3, 3, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </Stack>
            </SnapCard>
          ) : res.daily.length > 0 && (
            <DailyBarCard title="일별 정상금액" data={res.daily} dataKey="amt" fmt={manwon} color={CMP_A} />
          )}

          {/* 추적코드별 상세 (채널 모드에서만 — 전체 모드는 코드 행 없음) */}
          {res.mode !== 'total' && res.summary.rows?.length > 0 && (
            <TrackingCodesCard rowsA={res.summary.rows} rowsB={res.summaryB?.rows || []} cmp={res.cmp} />
          )}
          {res.mode !== 'total' && !res.summary.rows?.length && (
            <Banner status="warning" title="추적코드별 상세를 불러오지 못했어요"
                    description="응답에서 코드별 행을 찾지 못했어요. 이 화면 캡처를 공유해주시면 파싱을 실제 구조에 맞출게요." />
          )}
          {res.mode === 'total' && (
            <Text type="supporting" color="secondary">
              💡 추적코드별 상세는 채널 모드(앱+데라 · 앱 · 그룹 비교)로 조회하면 표시돼요. 채널을 바꾼 뒤 '매출 불러오기'를 다시 눌러주세요.
            </Text>
          )}

          {res.compare.length > 0 && (
            <Grid columns={{ minWidth: 340, repeat: 'fit' }} gap={3}>
              <SnapCard>
                <Stack gap={2}>
                  <Text type="label" weight="semibold">그룹별 정상금액</Text>
                  <ResponsiveContainer width="100%" height={Math.max(200, res.compare.length * 42)}>
                    <BarChart data={res.compare} layout="vertical" margin={{ top: 4, right: 70, left: 8, bottom: 4 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <RTooltip content={<ChartTip />} cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
                      <Bar dataKey="amt" fill="var(--ch-mobile, #4d8f7b)" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        <LabelList dataKey="amt" position="right" formatter={manwon} style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Stack>
              </SnapCard>
              <SnapCard>
                <Stack gap={2}>
                  <Text type="label" weight="semibold">그룹별 상세</Text>
                  <Table
                    data={res.compare}
                    idKey="name"
                    density="compact"
                    dividers="rows"
                    columns={[
                      { key: 'name', header: '그룹' },
                      { key: 'amt', header: '정상금액', renderCell: (r) => won(r.amt) },
                      { key: 'cnt', header: '결제건수', renderCell: (r) => comma(r.cnt) },
                      { key: 'profit', header: '판매이익', renderCell: (r) => won(r.profit) },
                    ]}
                  />
                </Stack>
              </SnapCard>
            </Grid>
          )}
        </>
      )}
      </div>

      <div style={{ display: salesTab === 'prod' ? 'contents' : 'none' }}>
{!VIEWER && (<>
        <Card padding={3}>
          <Stack gap={3}>
            <Stack direction="horizontal" gap={3} vAlign="end" wrap="wrap">
              <DateRangeInput label={cmpActive ? '조회 기간 (A)' : '조회 기간'} value={range} onChange={setRange} presets={PRESETS} />
              {cmpActive ? (
                <>
                  <DateRangeInput label="비교군 기간 (B)" value={cmpRange} onChange={setCmpRange} presets={PRESETS} />
                  <Button label="비교군 제거" variant="ghost" clickAction={() => setCmpOn(false)} />
                </>
              ) : (
                <Button label="+ 비교군 추가" variant="secondary" clickAction={addCmp} />
              )}
              <div style={{ minWidth: 240 }}>
                <Selector label="채널 (채널별 설정과 공유)" options={MODES} value={mode} onChange={setMode} />
              </div>
            </Stack>
            <TextArea
              label={`상품코드 (${parseCodes(prodCodesText).length}개 인식됨 · 최대 30개)`}
              description="쉼표·줄바꿈으로 여러 개 붙여넣기 — 선택한 채널 구성 안에서 팔린 금액만 집계돼요 · 일별 차트는 미지원"
              value={prodCodesText}
              onChange={setProdCodesText}
              rows={3}
            />
            <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
              <Button label={prodBusy ? '조회 중…' : '상품별 매출 불러오기'} variant="primary"
                      isDisabled={prodBusy} clickAction={loadProducts} />
              <Text type="supporting" color="secondary">상품당 요청 1회 (비교 시 2회) · 요청 간 0.25초 간격</Text>
            </Stack>
          </Stack>
        </Card>
</>)}

        {prodBusy && <ProgressBar done={prodProg.done} total={prodProg.total} msg={prodProg.msg} />}

        {resProd && (
          <>
            <Stack gap={0.5}>
              <Text type="label" weight="semibold">
                {resProd.cmp ? `A: ${resProd.labelA}  ·  B: ${resProd.labelB}` : resProd.labelA}
              </Text>
              <Text type="supporting" color="secondary">{resProd.modeLabel} · 상품 {comma(resProd.rows.length)}개</Text>
            </Stack>
            <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={3}>
              <Kpi label="정상금액 합계" value={won(resProd.totals.amt)}
                   badge={resProd.cmp ? <DeltaBadge cur={resProd.totals.amt} prev={resProd.totals.amtB} label="비교 기간 대비" /> : null} />
              <Kpi label="결제건수 합계" value={comma(resProd.totals.cnt) + '건'}
                   badge={resProd.cmp ? <DeltaBadge cur={resProd.totals.cnt} prev={resProd.totals.cntB} label="비교 기간 대비" /> : null} />
              <Kpi label="판매이익 합계" value={won(resProd.totals.profit)} />
              <Kpi label="조회 상품" value={comma(resProd.rows.length) + '개'} sub="0원 상품 포함" />
            </Grid>
            <SnapCard>
              <Stack gap={2}>
                <Text type="label" weight="semibold">상품별 상세</Text>
                <Table
                  data={prodSort.length
                    ? [...resProd.rows].sort((x, y) => {
                        const { sortKey, direction } = prodSort[0]
                        const av = x[sortKey] ?? -1, bv = y[sortKey] ?? -1
                        const d = av > bv ? 1 : av < bv ? -1 : 0
                        return direction === 'ascending' ? d : -d
                      })
                    : resProd.rows}
                  idKey="name" density="compact" dividers="rows"
                  plugins={{ sort: prodSortPlugin }}
                  columns={[
                    { key: 'name', header: '상품코드', renderCell: (r) => (
                        <span onClick={() => setSelProdCode(r)}
                              style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                          {r.name}
                        </span>
                      ) },
                    { key: 'amt', header: resProd.cmp ? 'A 매출' : '정상금액', sortable: true, renderCell: (r) => won(r.amt) },
                    ...(resProd.cmp ? [
                      { key: 'amtB', header: 'B 매출', sortable: true, renderCell: (r) => won(r.amtB) },
                      { key: 'dAmt', header: '변동', renderCell: (r) => <DeltaCellBadge cur={r.amt} prev={r.amtB} /> },
                    ] : []),
                    { key: 'cnt', header: resProd.cmp ? 'A 건수' : '결제건수', sortable: true, renderCell: (r) => comma(r.cnt) },
                    ...(resProd.cmp ? [
                      { key: 'cntB', header: 'B 건수', sortable: true, renderCell: (r) => comma(r.cntB) },
                    ] : []),
                    { key: 'profit', header: '판매이익', sortable: true, renderCell: (r) => won(r.profit) },
                  ]}
                />
                <Text type="supporting" color="secondary">상품코드 클릭 = 채널(추적코드) 비중 · 헤더 클릭 = 정렬</Text>
              </Stack>
            </SnapCard>
          </>
        )}
        {selProdCode && <PromoChannelDialog row={selProdCode} title={selProdCode.name}
                                            onClose={() => setSelProdCode(null)} />}
      </div>
    </Stack>
  )
}

/* ══════════════════ 회원 섹션 ══════════════════ */

function MembersSection() {
  const [range, setRange] = useState(lastWeekRange())
  const [withDaily, setWithDaily] = useState(true)

  const [busy, setBusy] = useState(false)
  const [prog, setProg] = useState({ msg: '', done: 0, total: 0 })
  const [error, setError] = useState(null)
  const [res, setResRaw] = useState(() => restoredOf('members'))
  const setRes = (v) => { setResRaw(v); if (v) registerSnap('members', v) }

  async function load() {
    if (!range?.start || !range?.end) { setError('기간을 선택해주세요.'); return }
    const { start: from, end: to } = range
    const nDays = dayCount(from, to)
    if (nDays > 62) { setError('기간이 62일을 넘어요. 나눠서 조회해주세요.'); return }

    const total = 3 + (withDaily ? nDays : 0)
    let done = 0
    const step = (msg) => setProg({ msg, done, total })
    const tick = () => { done++; setProg((p) => ({ ...p, done })) }

    setBusy(true); setError(null); setRes(null)
    try {
      step('전체 회원 조회 중…')
      const totalMem = await fetchMembers('', to)
      tick(); await sleep(250)
      step('기간 신규 가입 조회 중…')
      const joined = await fetchMembers(from, to)
      tick(); await sleep(250)
      step('직전 기간 가입 조회 중…')
      const prevJoined = await fetchMembers(shiftDays(from, -nDays), shiftDays(to, -nDays))
      tick(); await sleep(250)

      const daily = []
      if (withDaily) {
        for (const d of eachDay(from, to)) {
          step(`일별 가입 조회 중… ${d}`)
          const n = await fetchMembers(d, d)
          daily.push({ day: dayLabel(d), joined: n })
          tick(); await sleep(250)
        }
      }

      setRes({ total: totalMem, joined, prevJoined, daily, nDays, label: `${from} ~ ${to} (${nDays}일)` })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const avg = res && res.nDays ? Math.round(res.joined / res.nDays) : 0

  return (
    <Stack gap={4}>
{!VIEWER && (<>
      <Card padding={3}>
        <Stack gap={3}>
          <Stack direction="horizontal" gap={3} vAlign="end" wrap="wrap">
            <DateRangeInput label="가입 기간" value={range} onChange={setRange} presets={PRESETS} />
          </Stack>
          <Stack direction="horizontal" gap={4} vAlign="center" wrap="wrap">
            <Switch label="일별 가입 추이 조회 (하루당 요청 1회)" value={withDaily} onChange={setWithDaily} />
            <Button label={busy ? '조회 중…' : '회원 불러오기'} variant="primary" isDisabled={busy} clickAction={load} />
          </Stack>
        </Stack>
      </Card>
</>)}

      {busy && <ProgressBar done={prog.done} total={prog.total} msg={prog.msg} />}
      {error && <Banner status="error" title="조회 실패" description={error} />}

      {res && (
        <>
          <Text type="label" weight="semibold">{res.label}</Text>

          <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={3}>
            <Kpi label="신규 가입" value={comma(res.joined) + '명'}
                 badge={<DeltaBadge cur={res.joined} prev={res.prevJoined} />} />
            <Kpi label="일평균 가입" value={comma(avg) + '명'} sub="신규 가입 ÷ 일수" />
            <Kpi label="직전 기간 가입" value={comma(res.prevJoined) + '명'} sub="동일 길이 기간" />
            <Kpi label="전체 회원" value={comma(res.total) + '명'} sub={`${range.end} 기준 (정상 상태)`} />
          </Grid>

          {res.daily.length > 0 && (
            <DailyBarCard title="일별 신규 가입" data={res.daily} dataKey="joined"
                          fmt={comma} color="var(--ch-mobile, #4d8f7b)" />
          )}
        </>
      )}
    </Stack>
  )
}

/* ══════════════════ 주문서 섹션 ══════════════════ */

async function parseOrderFile(file) {
  return parseOrderBuffer(await file.arrayBuffer())
}

// 여러 파일을 워커 풀로 병렬 파싱 — 파일당 워커 1개, 완료마다 onOne 콜백
function parseFilesParallel(files, onOne) {
  return Promise.all(files.map((file, seq) => new Promise((resolve, reject) => {
    const w = new OrdersWorker()
    w.onmessage = (e) => {
      w.terminate()
      if (e.data.ok) { if (onOne) onOne(e.data.name); resolve({ ...e.data.parsed, fname: e.data.name }) }
      else reject(new Error(`${e.data.name}: ${e.data.error}`))
    }
    w.onerror = (err) => { w.terminate(); reject(new Error(err.message || '워커 오류')) }
    file.arrayBuffer().then((buf) => w.postMessage({ seq, buf, name: file.name }, [buf]))
      .catch(reject)
  })))
}

// 분할 내보내기 파일 병합: 헤더 일치 검증 + 완전 중복 행 제거
export function mergeParsedFiles(parsedList) {
  const norm = (hs) => hs.map((h) => String(h).replace(/\s+/g, '')).join('|')
  const base = norm(parsedList[0].headers)
  for (const p of parsedList.slice(1)) {
    if (norm(p.headers) !== base) {
      throw new Error(`파일 형식이 서로 달라요: "${parsedList[0].fname}" 와 "${p.fname}" 의 컬럼 구성이 다릅니다. 같은 내보내기에서 나온 분할 파일인지 확인해주세요.`)
    }
  }
  const seen = new Set()
  const data = []
  let dup = 0
  for (const p of parsedList) {
    for (const r of p.data) {
      const key = r.join('\u0001')
      if (seen.has(key)) { dup++; continue }
      seen.add(key)
      data.push(r)
    }
  }
  return {
    headers: parsedList[0].headers,
    sheet: parsedList[0].sheet,
    data,
    dup,
    fname: parsedList.length === 1 ? parsedList[0].fname : `${parsedList.length}개 파일 병합`,
    fnames: parsedList.map((p) => p.fname),
  }
}

const ROUTE_COLORS = ['#1c4f3a', '#e6b422', '#4d8f7b', '#97a3a0', '#8a6d3b', '#3b6d8a', '#a35d5d', '#6d5da3']
const GRADE_ORDER = ['씨앗', '새싹', '잎새', '열매', '나무', '비회원']
const GRADE_COLORS = { '씨앗': '#b7c9a8', '새싹': '#8fb07e', '잎새': '#5f9060', '열매': '#3a704c', '나무': '#1c4f3a', '비회원': '#b8b3a6' }

// 주문서 분석: 상태 제외 + 잔여 결제 금액(부분취소 반영) 우선
// 주문 단위 파일과 주문상품(옵션) 단위 파일 모두 지원 — 컬럼명 공백 무시 매칭
export function analyzeOrders(headers, data) {
  const norm = (s) => String(s).replace(/\s+/g, '')
  const H = headers.map(norm)
  const col = (...names) => {
    for (const n of names) { const i = H.indexOf(norm(n)); if (i >= 0) return i }
    return -1
  }
  const c = {
    orderNo: col('주문번호'), status: col('주문 상태', '주문상태'),
    amtRemain: col('잔여 결제 금액'), amt: col('결제 금액'),
    route: col('주문 경로', '주문경로'), member: col('회원 여부'), grade: col('회원 등급'),
    product: col('상품명'), code: col('상품코드'), qty: col('잔여수량', '주문수량'),
    profit: col('잔여 판매이익', '판매이익'), channel: col('채널명'),
  }
  if (c.amt < 0 && c.amtRemain < 0) return null
  const isItemLevel = c.product >= 0
  const num = (v) => Number(String(v ?? '').replace(/[^0-9-]/g, '')) || 0

  // 버킷: cnt=고유 주문수, rows=상품행수, amt/qty/profit 합계
  const mk = () => new Map()
  const routeMap = mk(), memberMap = mk(), gradeMap = mk(), prodMap = mk(), chMap = mk()
  const add = (map, key, amt, orderNo, extra) => {
    const o = map.get(key) || { cnt: 0, rows: 0, amt: 0, qty: 0, profit: 0, _orders: new Set() }
    o.rows++; o.amt += amt
    if (extra) { o.qty += extra.qty; o.profit += extra.profit }
    if (orderNo && !o._orders.has(orderNo)) { o._orders.add(orderNo); o.cnt++ }
    else if (!orderNo) o.cnt++
    map.set(key, o)
  }
  let excluded = 0, totalAmt = 0, totalRows = 0
  const uniqOrders = new Set()
  for (const r of data) {
    const st = c.status >= 0 ? String(r[c.status] || '') : ''
    if (EXCLUDE_STATUS.test(st)) { excluded++; continue }
    // 잔여 결제 금액 컬럼이 있으면 그 값을 그대로 사용 (0 = 전액취소 → 0원으로 반영)
    const amt = c.amtRemain >= 0 ? num(r[c.amtRemain]) : num(r[c.amt])
    const orderNo = c.orderNo >= 0 ? String(r[c.orderNo] || '') : ''
    const extra = { qty: c.qty >= 0 ? num(r[c.qty]) : 0, profit: c.profit >= 0 ? num(r[c.profit]) : 0 }
    totalAmt += amt; totalRows++
    if (orderNo) uniqOrders.add(orderNo)
    if (c.route >= 0) add(routeMap, String(r[c.route] || '미상'), amt, orderNo)
    const mb = c.member >= 0 ? String(r[c.member] || '미상') : '미상'
    add(memberMap, mb, amt, orderNo)
    if (c.grade >= 0) {
      const g = String(r[c.grade] || '') || (mb === '비회원' ? '비회원' : '미상')
      add(gradeMap, g, amt, orderNo)
    }
    if (c.product >= 0) {
      const p = String(r[c.product] || '').trim()
      if (p) {
        add(prodMap, p, amt, orderNo, extra)
        // 상품별 드릴다운: 경로/추적코드 세부
        const po = prodMap.get(p)
        if (!po.code && c.code >= 0) po.code = String(r[c.code] || '').trim()
        if (!po.byRoute) { po.byRoute = new Map(); po.byChannel = new Map() }
        if (c.route >= 0) {
          const rt = String(r[c.route] || '미상')
          po.byRoute.set(rt, (po.byRoute.get(rt) || 0) + amt)
        }
        if (c.channel >= 0) {
          const ch = String(r[c.channel] || '').trim() || '(채널명 없음)'
          const cur = po.byChannel.get(ch) || { amt: 0, qty: 0, profit: 0, _orders: new Set() }
          cur.amt += amt; cur.qty += extra.qty; cur.profit += extra.profit
          if (orderNo) cur._orders.add(orderNo)
          po.byChannel.set(ch, cur)
        }
      }
    }
    if (c.channel >= 0) {
      const ch = String(r[c.channel] || '').trim() || '(채널명 없음)'
      add(chMap, ch, amt, orderNo, extra)
      // 추적코드 드릴다운: 구매 회원 등급 세부
      if (c.grade >= 0) {
        const co = chMap.get(ch)
        if (!co.byGrade) co.byGrade = new Map()
        const g = String(r[c.grade] || '') || (mb === '비회원' ? '비회원' : '미상')
        const cur = co.byGrade.get(g) || { amt: 0, _orders: new Set() }
        cur.amt += amt
        if (orderNo) cur._orders.add(orderNo)
        co.byGrade.set(g, cur)
      }
    }
  }
  const toArr = (map) => [...map.entries()].map(([name, o]) => {
    const { _orders, byRoute, byChannel, byGrade, ...rest } = o
    const out = { name, ...rest }
    if (byRoute) out.byRoute = [...byRoute.entries()].map(([n, amt]) => ({ name: n, amt })).sort((a, b) => b.amt - a.amt)
    if (byChannel) out.byChannel = [...byChannel.entries()].map(([n, v]) => {
      const { _orders, ...vv } = v
      return { name: n, ...vv, cnt: _orders ? _orders.size : 0 }
    }).sort((a, b) => b.amt - a.amt)
    if (byGrade) {
      const arr = [...byGrade.entries()].map(([n, v]) => ({ name: n, amt: v.amt, cnt: v._orders.size }))
      out.byGrade = arr.sort((a, b) => {
        const ai = GRADE_ORDER.indexOf(a.name), bi = GRADE_ORDER.indexOf(b.name)
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
      })
    }
    return out
  })
  const routesAll = toArr(routeMap).sort((a, b) => b.amt - a.amt)
  const routes = []
  let etc = null
  routesAll.forEach((r) => {
    if (totalAmt && r.amt / totalAmt < 0.01) {
      if (!etc) { etc = { name: '기타 (1% 미만)', cnt: 0, amt: 0, sub: [] }; routes.push(etc) }
      etc.cnt += r.cnt; etc.amt += r.amt; etc.sub.push(r.name)
    } else routes.push(r)
  })
  const grades = GRADE_ORDER.filter((g) => gradeMap.has(g)).map((g) => {
    const { _orders, ...rest } = gradeMap.get(g)
    return { name: g, ...rest }
  })
  const gExtra = toArr(gradeMap).filter((g) => !GRADE_ORDER.includes(g.name))
  return {
    excluded, totalAmt, isItemLevel,
    totalCnt: uniqOrders.size || totalRows, totalRows,
    routes, routesAll,
    members: toArr(memberMap).sort((a, b) => b.amt - a.amt),
    grades: [...grades, ...gExtra],
    products: toArr(prodMap).sort((a, b) => b.amt - a.amt),
    channels: toArr(chMap).sort((a, b) => b.amt - a.amt),
  }
}

export function RankTable({ rows, totalAmt, unit, onPick, onTopCodeClick, topCodeFilterCount, bmap }) {
  const [sort, setSort] = useState([])
  const sortPlugin = useTableSortable({ sort, onSortChange: setSort })
  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }))
  const sorted = sort.length
    ? [...ranked].sort((a, b) => {
        const { sortKey, direction } = sort[0]
        const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
        const d = av > bv ? 1 : av < bv ? -1 : 0
        return direction === 'ascending' ? d : -d
      })
    : ranked
  const hasCode = rows.some((r) => r.code)
  const hasTopCode = !!onTopCodeClick && rows.some((r) => r.byChannel?.length)
  return (
    <Table
      data={sorted}
      idKey="name"
      density="compact"
      dividers="rows"
      textOverflow="truncate"
      plugins={{ sort: sortPlugin }}
      columns={[
        { key: 'rank', header: '#', sortable: true },
        ...(hasTopCode ? [{ key: 'topCode',
          header: (
            <span onClick={onTopCodeClick}
                  style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600 }}>
              주요 추적코드{topCodeFilterCount ? ` (${topCodeFilterCount})` : ''} ▾
            </span>
          ),
          renderCell: (r) => (
            <Text type="supporting" color="secondary">{r.byChannel?.[0]?.name || '–'}</Text>
          ) }] : []),
        ...(hasCode ? [{ key: 'code', header: '상품코드', renderCell: (r) => (
          <Text type="supporting" color="secondary">{r.code || '–'}</Text>
        ) }] : []),
        { key: 'name', header: unit, renderCell: (r) => onPick ? (
            <span onClick={() => onPick(r)}
                  style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {r.name}
            </span>
          ) : r.name },
        { key: 'amt', header: bmap ? 'A 매출' : '매출', sortable: true,
          renderCell: (r) => `${won(r.amt)} (${totalAmt ? (r.amt / totalAmt * 100).toFixed(1) : 0}%)` },
        ...(bmap ? [
          { key: 'amtB', header: 'B 매출', renderCell: (r) => { const x = bmap.get(r.name); return x ? won(x.amt) : '–' } },
          { key: 'delta', header: '변동', renderCell: (r) => <DeltaCellBadge cur={r.amt} prev={bmap.get(r.name)?.amt ?? null} /> },
        ] : []),
        { key: 'cnt', header: '주문수', sortable: true, renderCell: (r) => comma(r.cnt) },
        { key: 'qty', header: '수량', sortable: true, renderCell: (r) => comma(r.qty) },
        { key: 'profit', header: '판매이익', sortable: true, renderCell: (r) => won(r.profit) },
      ]}
    />
  )
}

function ProductDetailDialog({ prod, totalAmt, onClose }) {
  if (!prod) return null
  const share = totalAmt ? (prod.amt / totalAmt * 100).toFixed(1) : 0
  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) onClose() }} width={780} maxHeight="85vh">
      <Layout
        header={<DialogHeader title={prod.name} subtitle={`매출 ${won(prod.amt)} (전체의 ${share}%) · 주문 ${comma(prod.cnt)}건 · 수량 ${comma(prod.qty)} · 판매이익 ${won(prod.profit)}`}
                              onOpenChange={(open) => { if (!open) onClose() }} />}
        content={
          <LayoutContent>
            <Stack gap={3}>
              {prod.byRoute?.length > 0 && (
                <Stack gap={1}>
                  <Text type="label" weight="semibold">주문경로 비중</Text>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={prod.byRoute} dataKey="amt" nameKey="name" innerRadius={50} outerRadius={82}
                           paddingAngle={1.5} strokeWidth={0}>
                        {prod.byRoute.map((r, i) => <Cell key={r.name} fill={ROUTE_COLORS[i % ROUTE_COLORS.length]} />)}
                      </Pie>
                      <RTooltip formatter={(v, n) => [`${won(v)} (${prod.amt ? (v / prod.amt * 100).toFixed(1) : 0}%)`, n]} />
                      <Legend iconType="circle" iconSize={9}
                              formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </Stack>
              )}
              {prod.byChannel?.length > 0 && (
                <Stack gap={1}>
                  <Text type="label" weight="semibold">추적코드별 (상위 10)</Text>
                  <Table
                    data={prod.byChannel.slice(0, 10)}
                    idKey="name"
                    density="compact"
                    dividers="rows"
                    columns={[
                      { key: 'name', header: '추적코드' },
                      { key: 'amt', header: '매출', renderCell: (r) => `${won(r.amt)} (${prod.amt ? (r.amt / prod.amt * 100).toFixed(1) : 0}%)` },
                      { key: 'qty', header: '수량', renderCell: (r) => comma(r.qty) },
                    ]}
                  />
                </Stack>
              )}
            </Stack>
          </LayoutContent>
        }
      />
    </Dialog>
  )
}

function ChannelDetailDialog({ ch, totalAmt, onClose }) {
  if (!ch) return null
  const share = totalAmt ? (ch.amt / totalAmt * 100).toFixed(1) : 0
  const grades = ch.byGrade || []
  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) onClose() }} width={780} maxHeight="85vh">
      <Layout
        header={<DialogHeader title={ch.name} subtitle={`매출 ${won(ch.amt)} (전체의 ${share}%) · 주문 ${comma(ch.cnt)}건 · 수량 ${comma(ch.qty)} · 판매이익 ${won(ch.profit)}`}
                              onOpenChange={(open) => { if (!open) onClose() }} />}
        content={
          <LayoutContent>
            <Stack gap={3}>
              {grades.length > 0 ? (
                <>
                  <Stack gap={1}>
                    <Text type="label" weight="semibold">구매 회원 등급 비중 (매출)</Text>
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie data={grades} dataKey="amt" nameKey="name" innerRadius={52} outerRadius={86}
                             paddingAngle={1.5} strokeWidth={0}>
                          {grades.map((g) => <Cell key={g.name} fill={GRADE_COLORS[g.name] || '#97a3a0'} />)}
                        </Pie>
                        <RTooltip formatter={(v, n) => [`${won(v)} (${ch.amt ? (v / ch.amt * 100).toFixed(1) : 0}%)`, n]} />
                        <Legend iconType="circle" iconSize={9}
                                formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Stack>
                  <Table
                    data={grades}
                    idKey="name"
                    density="compact"
                    dividers="rows"
                    columns={[
                      { key: 'name', header: '등급' },
                      { key: 'amt', header: '매출', renderCell: (r) => `${won(r.amt)} (${ch.amt ? (r.amt / ch.amt * 100).toFixed(1) : 0}%)` },
                      { key: 'cnt', header: '주문수', renderCell: (r) => comma(r.cnt) },
                      { key: 'aov', header: '객단가', renderCell: (r) => r.cnt ? won(Math.round(r.amt / r.cnt)) : '–' },
                    ]}
                  />
                </>
              ) : (
                <Text color="secondary">이 파일에는 회원 등급 정보가 없어요.</Text>
              )}
            </Stack>
          </LayoutContent>
        }
      />
    </Dialog>
  )
}

function ShareTable({ rows, totalAmt, totalCnt, withAov, bmap }) {
  const cols = [
    { key: 'name', header: '구분' },
    { key: 'cnt', header: bmap ? '주문건수 (A)' : '주문건수', renderCell: (r) => `${comma(r.cnt)}건 (${totalCnt ? (r.cnt / totalCnt * 100).toFixed(1) : 0}%)` },
    { key: 'amt', header: bmap ? 'A 매출' : '매출', renderCell: (r) => `${won(r.amt)} (${totalAmt ? (r.amt / totalAmt * 100).toFixed(1) : 0}%)` },
  ]
  if (bmap) {
    cols.push(
      { key: 'amtB', header: 'B 매출', renderCell: (r) => { const x = bmap.get(r.name); return x ? won(x.amt) : '–' } },
      { key: 'delta', header: '변동', renderCell: (r) => <DeltaCellBadge cur={r.amt} prev={bmap.get(r.name)?.amt ?? null} /> },
    )
  }
  if (withAov) cols.push({ key: 'aov', header: '객단가', renderCell: (r) => r.cnt ? won(Math.round(r.amt / r.cnt)) : '–' })
  return <Table data={rows} idKey="name" density="compact" dividers="rows" columns={cols} />
}

function DonutCard({ title, rows, totalAmt, colorOf, extra }) {
  return (
    <SnapCard>
      <Stack gap={2}>
        <Text type="label" weight="semibold">{title}</Text>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={rows} dataKey="amt" nameKey="name" innerRadius={56} outerRadius={90}
                 paddingAngle={1.5} strokeWidth={0}>
              {rows.map((r, i) => <Cell key={r.name} fill={colorOf(r, i)} />)}
            </Pie>
            <RTooltip formatter={(v, n) => [`${won(v)} (${totalAmt ? (v / totalAmt * 100).toFixed(1) : 0}%)`, n]} />
            <Legend iconType="circle" iconSize={9}
                    formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
        {extra}
      </Stack>
    </SnapCard>
  )
}

/* ══════════════════ 상품 분류 · 채널그룹×카테고리 · 등급별 수요 ══════════════════ */

const BASE_CLASSES = [
  { name: '간편식', re: /간편식|밀키트|국탕찌|반건조.?즉석|즉석/ },
  { name: '김치',   re: /김치|깍두기|동치미|물김치|겉절이/ },
  { name: '과일',   re: /과일|제철과일/ },
  { name: '수산물', re: /수산|해산|생선|건어물/ },
  { name: '축산물', re: /축산|정육|한우|돼지|계란|달걀/ },
  { name: '농산물', re: /농산|채소|야채|나물|곡물|잡곡|쌀/ },
]
export const EXT_CLASSES = ['반찬', '떡', '양념', '건강식품']
const CLASS_RULES_KEY = 'jwbm_class_rules_v1'

export function normalizeClassRules(raw) {
  const base = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw.rules && typeof raw.rules === 'object' && !Array.isArray(raw.rules) ? raw.rules : raw)
    : {}
  const out = {}
  for (const cls of EXT_CLASSES) {
    const v = base[cls]
    if (Array.isArray(v)) out[cls] = v.filter((t) => typeof t === 'string')
    else if (v && typeof v === 'object') out[cls] = Object.keys(v).filter((k) => v[k])
    else if (typeof v === 'string') out[cls] = v.split('|').map((s) => s.trim()).filter(Boolean)
    else out[cls] = []
  }
  return out
}
export function loadClassRules() {
  try { return normalizeClassRules(JSON.parse(localStorage.getItem(CLASS_RULES_KEY) || '{}')) } catch { return normalizeClassRules({}) }
}
export function saveClassRules(rules) {
  try { localStorage.setItem(CLASS_RULES_KEY, JSON.stringify(normalizeClassRules(rules))) } catch { /* 무시 */ }
}

export function classifyWithRules(tokens, rules) {
  const joined = tokens.join('|')
  for (const c of BASE_CLASSES) if (c.re.test(joined)) return c.name
  for (const cls of EXT_CLASSES) {
    const toks = Array.isArray(rules?.[cls]) ? rules[cls] : []
    if (toks.some((t) => tokens.includes(t))) return cls
  }
  return '기타'
}

export function buildProductClassMap(headers, data, rules) {
  const map = new Map()
  for (const r of data) {
    const code = String(r[0] || '').trim()
    if (!code) continue
    const toks = []
    for (const idx of [22, 24]) {
      String(r[idx] || '').split('|').forEach((t) => { const s = t.trim(); if (s) toks.push(s) })
    }
    map.set(code, { tokens: toks, cls: classifyWithRules(toks, rules) })
  }
  return map
}
export function reclassifyMap(map, rules) {
  const out = new Map()
  for (const [code, v] of map) out.set(code, { tokens: v.tokens, cls: classifyWithRules(v.tokens, rules) })
  return out
}

const CODE_TO_GROUP = (() => {
  const m = new Map()
  for (const g of WEEKLY_GROUPS) {
    for (const idx of g.idxs.split(',')) {
      const c = CODES.find((x) => x.i === idx)
      if (c) m.set(c.n, g.name)
    }
  }
  return m
})()
const groupOfChannel = (name) => {
  if (!name || name === '(채널명 없음)') return '앱(푸시제외)'
  return CODE_TO_GROUP.get(name) || '앱(푸시제외)'
}
export const MATRIX_CLASS_ORDER = () => [...BASE_CLASSES.map((c) => c.name), ...EXT_CLASSES, '기타']

export function computeChannelCategoryMatrix(headers, data, classMap) {
  const norm = (s) => String(s).replace(/\s+/g, '')
  const H = headers.map(norm)
  const col = (...names) => { for (const n of names) { const i = H.indexOf(norm(n)); if (i >= 0) return i } return -1 }
  const c = {
    orderNo: col('주문번호'), status: col('주문 상태', '주문상태'),
    amtRemain: col('잔여 결제 금액'), amt: col('결제 금액'),
    code: col('상품코드'), product: col('상품명'), qty: col('잔여수량', '주문수량'),
    channel: col('채널명'),
  }
  if (c.code < 0 || c.channel < 0) return null
  const num = (v) => Number(String(v ?? '').replace(/[^0-9-]/g, '')) || 0
  const cells = new Map()
  const groupTotals = new Map(), groupCodes = new Map()
  for (const r of data) {
    const st = c.status >= 0 ? String(r[c.status] || '') : ''
    if (EXCLUDE_STATUS.test(st)) continue
    const amt = c.amtRemain >= 0 ? num(r[c.amtRemain]) : num(r[c.amt])
    const orderNo = c.orderNo >= 0 ? String(r[c.orderNo] || '') : ''
    const code = String(r[c.code] || '').trim()
    const ch = String(r[c.channel] || '').trim() || '(채널명 없음)'
    const grp = groupOfChannel(ch)
    const cls = classMap.get(code)?.cls || '기타'
    const key = grp + '\u0000' + cls
    let cell = cells.get(key)
    if (!cell) { cell = { amt: 0, _orders: new Set(), products: new Map() }; cells.set(key, cell) }
    cell.amt += amt
    if (orderNo) cell._orders.add(orderNo)
    let p = cell.products.get(code)
    if (!p) { p = { code, name: c.product >= 0 ? String(r[c.product] || '').trim() : code, amt: 0, qty: 0, _orders: new Set(), byChannel: new Map() }; cell.products.set(code, p) }
    p.amt += amt; p.qty += c.qty >= 0 ? num(r[c.qty]) : 0
    if (orderNo) p._orders.add(orderNo)
    p.byChannel.set(ch, (p.byChannel.get(ch) || 0) + amt)
    const gt = groupTotals.get(grp) || { amt: 0, _orders: new Set() }
    gt.amt += amt; if (orderNo) gt._orders.add(orderNo)
    groupTotals.set(grp, gt)
    const gc = groupCodes.get(grp) || new Map()
    gc.set(ch, (gc.get(ch) || 0) + amt)
    groupCodes.set(grp, gc)
  }
  const classes = MATRIX_CLASS_ORDER()
  const groups = WEEKLY_GROUPS.map((g) => g.name).filter((g) => groupTotals.has(g))
  const rows = groups.map((g) => {
    const gt = groupTotals.get(g)
    const byClass = {}
    for (const cls of classes) {
      const cell = cells.get(g + '\u0000' + cls)
      if (!cell) continue
      const products = [...cell.products.values()].map((p) => ({
        code: p.code, name: p.name, amt: p.amt, qty: p.qty, cnt: p._orders.size,
        byChannel: [...p.byChannel.entries()].map(([n, a]) => ({ name: n, amt: a })).sort((x, y) => y.amt - x.amt),
      })).sort((x, y) => y.amt - x.amt)
      byClass[cls] = { amt: cell.amt, cnt: cell._orders.size, products }
    }
    return {
      group: g, amt: gt.amt, cnt: gt._orders.size, byClass,
      codes: [...groupCodes.get(g).entries()].map(([n, a]) => ({ name: n, amt: a })).sort((x, y) => y.amt - x.amt),
    }
  }).sort((x, y) => y.amt - x.amt)
  return { classes, rows }
}
export function trimMatrixForSnap(matrix) {
  if (!matrix) return null
  return {
    classes: matrix.classes,
    rows: matrix.rows.map((r) => ({
      ...r,
      codes: r.codes.slice(0, 20),
      byClass: Object.fromEntries(Object.entries(r.byClass).map(([cls, cell]) => [cls, {
        amt: cell.amt, cnt: cell.cnt,
        products: cell.products.slice(0, 30).map((p) => ({ ...p, byChannel: p.byChannel.slice(0, 10) })),
      }])),
    })),
  }
}

export function computeGradeProducts(headers, data) {
  const norm = (s) => String(s).replace(/\s+/g, '')
  const H = headers.map(norm)
  const col = (...names) => { for (const n of names) { const i = H.indexOf(norm(n)); if (i >= 0) return i } return -1 }
  const c = {
    orderNo: col('주문번호'), status: col('주문 상태', '주문상태'),
    amtRemain: col('잔여 결제 금액'), amt: col('결제 금액'),
    grade: col('회원 등급'), member: col('회원 여부'),
    code: col('상품코드'), product: col('상품명'), qty: col('잔여수량', '주문수량'),
    channel: col('채널명'),
  }
  if (c.grade < 0 || c.product < 0) return null
  const num = (v) => Number(String(v ?? '').replace(/[^0-9-]/g, '')) || 0
  const perGrade = new Map()
  for (const r of data) {
    const st = c.status >= 0 ? String(r[c.status] || '') : ''
    if (EXCLUDE_STATUS.test(st)) continue
    const amt = c.amtRemain >= 0 ? num(r[c.amtRemain]) : num(r[c.amt])
    const orderNo = c.orderNo >= 0 ? String(r[c.orderNo] || '') : ''
    const mb = c.member >= 0 ? String(r[c.member] || '') : ''
    let g = String(r[c.grade] || '').trim()
    if (!g) g = mb === '비회원' ? '비회원' : '(등급 없음)'
    const key = String(r[c.product] || '').trim()
    if (!key) continue
    let gm = perGrade.get(g)
    if (!gm) { gm = { amt: 0, _orders: new Set(), products: new Map() }; perGrade.set(g, gm) }
    gm.amt += amt; if (orderNo) gm._orders.add(orderNo)
    let p = gm.products.get(key)
    if (!p) { p = { name: key, code: c.code >= 0 ? String(r[c.code] || '').trim() : '', amt: 0, qty: 0, _orders: new Set(), channels: new Map() }; gm.products.set(key, p) }
    p.amt += amt; p.qty += c.qty >= 0 ? num(r[c.qty]) : 0
    if (orderNo) p._orders.add(orderNo)
    if (c.channel >= 0) {
      const ch = String(r[c.channel] || '').trim() || '(채널명 없음)'
      p.channels.set(ch, (p.channels.get(ch) || 0) + amt)
    }
  }
  const order = [...GRADE_ORDER, '(등급 없음)']
  const grades = [...perGrade.keys()].sort((a, b) => {
    const ai = order.indexOf(a), bi = order.indexOf(b)
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
  })
  return grades.map((g) => {
    const gm = perGrade.get(g)
    return {
      grade: g, amt: gm.amt, cnt: gm._orders.size,
      products: [...gm.products.values()].map((p) => ({
        name: p.name, code: p.code, amt: p.amt, qty: p.qty, cnt: p._orders.size,
        channels: [...p.channels.entries()].map(([n, a]) => ({ name: n, amt: a })).sort((x, y) => y.amt - x.amt),
      })).sort((x, y) => y.amt - x.amt).slice(0, 30),
    }
  })
}
export function trimGradeProductsForSnap(gp) {
  if (!gp) return null
  return gp.map((g) => ({ ...g, products: g.products.map((p) => ({ ...p, channels: p.channels.slice(0, 10) })) }))
}

/* ══════════════════ 시간대별 주문 분석 (v49) ══════════════════ */

const APP_GROUPS = new Set(['앱(푸시제외)', '앱푸시'])
const NOT_PURE_APP_RE = /데라|datarize|와이즈|wisetracker/i

export function computeHourlyTags(headers, data) {
  const norm = (s) => String(s).replace(/\s+/g, '')
  const H = headers.map(norm)
  const col = (...names) => { for (const n of names) { const i = H.indexOf(norm(n)); if (i >= 0) return i } return -1 }
  const c = { orderNo: col('주문번호'), status: col('주문 상태', '주문상태'),
              date: col('주문일', '주문일시'), member: col('회원 여부'), channel: col('채널명') }
  if (c.date < 0) return null
  const seen = new Set()
  const tags = []
  let hasTime = false, hasMemberCol = c.member >= 0
  for (const r of data) {
    const st = c.status >= 0 ? String(r[c.status] || '') : ''
    if (EXCLUDE_STATUS.test(st)) continue
    const orderNo = c.orderNo >= 0 ? String(r[c.orderNo] || '') : ''
    if (orderNo) { if (seen.has(orderNo)) continue; seen.add(orderNo) }
    const dt = String(r[c.date] || '')
    const day = dt.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}/.test(day)) continue
    const tm = dt.match(/(\d{1,2}):\d{2}/)
    const h = tm ? Math.min(23, +tm[1]) : 0
    if (tm) hasTime = true
    const mb = hasMemberCol ? String(r[c.member] || '').trim() : ''
    const m = mb === '회원' ? 1 : mb === '비회원' ? 0 : 2
    const ch = String(r[c.channel] || '').trim() || '(채널명 없음)'
    const grp = groupOfChannel(ch)
    const p = APP_GROUPS.has(grp) && !NOT_PURE_APP_RE.test(ch) ? 1 : 0
    tags.push({ h, m, p, grp, ch, day })
  }
  return { tags, hasTime, hasMemberCol }
}

export function hourlyCubeFromTags(tagInfo) {
  if (!tagInfo) return null
  const z = () => [[0, 0], [0, 0], [0, 0]]
  const byHour = Array.from({ length: 24 }, z)
  const chByHour = Array.from({ length: 24 }, () => ({}))
  for (const t of tagInfo.tags) {
    byHour[t.h][t.m][t.p]++
    const g = chByHour[t.h][t.ch] || (chByHour[t.h][t.ch] = z())
    g[t.m][t.p]++
  }
  return { byHour, chByHour, hasTime: tagInfo.hasTime, hasMemberCol: tagInfo.hasMemberCol, total: tagInfo.tags.length }
}

const memIdxsOf = (f) => f === 'm' ? [1] : f === 'n' ? [0] : [0, 1, 2]
const pIdxsOf = (f) => f === 'pure' ? [1] : [0, 1]

export function hourlyBuckets({ tags, cube }, unit, memF, chF, day = null) {
  const nb = Math.ceil(24 / unit)
  const cnts = new Array(nb).fill(0)
  if (tags) {
    for (const t of tags) {
      if (day && t.day !== day) continue
      if (memF === 'm' ? t.m !== 1 : memF === 'n' ? t.m !== 0 : false) continue
      if (chF === 'pure' && !t.p) continue
      cnts[Math.floor(t.h / unit)]++
    }
  } else if (cube) {
    const ms = memIdxsOf(memF), ps = pIdxsOf(chF)
    for (let h = 0; h < 24; h++)
      for (const m of ms) for (const p of ps) cnts[Math.floor(h / unit)] += cube.byHour[h][m][p]
  }
  const total = cnts.reduce((a, b) => a + b, 0)
  return {
    total,
    rows: cnts.map((cnt, i) => ({
      name: unit === 1 ? `${i}시` : `${i * unit}~${i * unit + unit}시`,
      start: i * unit, cnt, pct: total ? cnt / total * 100 : 0,
    })),
  }
}

export function hourlyDrill({ tags, cube }, unit, bucketStart, memF, chF, day = null) {
  const map = new Map()
  if (tags) {
    for (const t of tags) {
      if (t.h < bucketStart || t.h >= bucketStart + unit) continue
      if (day && t.day !== day) continue
      if (memF === 'm' ? t.m !== 1 : memF === 'n' ? t.m !== 0 : false) continue
      if (chF === 'pure' && !t.p) continue
      map.set(t.grp, (map.get(t.grp) || 0) + 1)
    }
  } else if (cube) {
    const ms = memIdxsOf(memF), ps = pIdxsOf(chF)
    const src2 = cube.chByHour || cube.drill
    const isCh = !!cube.chByHour
    for (let h = bucketStart; h < Math.min(24, bucketStart + unit); h++)
      for (const [key, arr] of Object.entries(src2[h])) {
        const grp = isCh ? groupOfChannel(key) : key
        for (const m of ms) for (const p of ps)
          if (arr[m][p]) map.set(grp, (map.get(grp) || 0) + arr[m][p])
      }
  }
  return [...map.entries()].map(([name, cnt]) => ({ name, amt: cnt })).sort((a, b) => b.amt - a.amt || a.name.localeCompare(b.name))
}

export function hourlyDrill2({ tags, cube }, unit, bucketStart, group, memF, chF, day = null) {
  const map = new Map()
  if (tags) {
    for (const t of tags) {
      if (t.h < bucketStart || t.h >= bucketStart + unit) continue
      if (t.grp !== group) continue
      if (day && t.day !== day) continue
      if (memF === 'm' ? t.m !== 1 : memF === 'n' ? t.m !== 0 : false) continue
      if (chF === 'pure' && !t.p) continue
      map.set(t.ch, (map.get(t.ch) || 0) + 1)
    }
  } else if (cube?.chByHour) {
    const ms = memIdxsOf(memF), ps = pIdxsOf(chF)
    for (let h = bucketStart; h < Math.min(24, bucketStart + unit); h++)
      for (const [ch, arr] of Object.entries(cube.chByHour[h])) {
        if (groupOfChannel(ch) !== group) continue
        for (const m of ms) for (const p of ps)
          if (arr[m][p]) map.set(ch, (map.get(ch) || 0) + arr[m][p])
      }
  }
  return [...map.entries()].map(([name, cnt]) => ({ name, amt: cnt })).sort((a, b) => b.amt - a.amt || a.name.localeCompare(b.name))
}

export function hourColor(start, unit) {
  const mid = start + unit / 2
  const t = Math.abs(mid - 13) / 13
  const g = [28, 79, 58], y = [230, 180, 34]
  const evening = mid >= 16
  const mix = evening ? Math.min(1, (mid - 16) / 7) : 0
  const light = 1 - t * 0.55
  const c = g.map((gc, i) => Math.round((gc + (y[i] - gc) * mix) * (evening ? 1 : (0.55 + light * 0.6))))
  return `rgb(${Math.min(255, c[0])},${Math.min(255, c[1])},${Math.min(255, c[2])})`
}

// 공용 미니 도넛+표 다이얼로그 골격 (fmt/onRowClick — v49.1 통합판)
function DonutTableDialog({ title, subtitle, rows, total, onClose, unitLabel = '추적코드', valueLabel = '매출', fmt = won, onRowClick }) {
  const top = rows.slice(0, 8)
  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) onClose() }} width={720} maxHeight="85vh">
      <Layout
        header={<DialogHeader title={title} subtitle={subtitle}
                              onOpenChange={(open) => { if (!open) onClose() }} />}
        content={
          <LayoutContent>
            <Stack gap={3}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={top} dataKey="amt" nameKey="name" innerRadius={50} outerRadius={82}
                       paddingAngle={1.5} strokeWidth={0}>
                    {top.map((r, i) => <Cell key={r.name} fill={ROUTE_COLORS[i % ROUTE_COLORS.length]} />)}
                  </Pie>
                  <RTooltip formatter={(v, n) => [`${fmt(v)} (${total ? (v / total * 100).toFixed(1) : 0}%)`, n]} />
                  <Legend iconType="circle" iconSize={9}
                          formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <Table data={rows} idKey="name" density="compact" dividers="rows"
                     columns={[
                       { key: 'name', header: unitLabel, renderCell: (r) => onRowClick ? (
                           <span onClick={() => onRowClick(r)}
                                 style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                             {r.name}
                           </span>
                         ) : r.name },
                       { key: 'amt', header: valueLabel, renderCell: (r) => `${fmt(r.amt)} (${total ? (r.amt / total * 100).toFixed(1) : 0}%)` },
                     ]} />
            </Stack>
          </LayoutContent>
        }
      />
    </Dialog>
  )
}

function CellProductsDialog({ cell, group, cls, onClose }) {
  const [pick, setPick] = useState(cell.products[0] || null)
  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) onClose() }} width={980} maxHeight="88vh">
      <Layout
        header={<DialogHeader title={`${group} × ${cls}`}
                              subtitle={`매출 ${won(cell.amt)} · 주문 ${comma(cell.cnt)}건 · 상품 ${comma(cell.products.length)}개`}
                              onOpenChange={(open) => { if (!open) onClose() }} />}
        content={
          <LayoutContent>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
              <div style={{ maxHeight: '58vh', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                {cell.products.map((p) => (
                  <div key={p.code + p.name} onClick={() => setPick(p)}
                       style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
                                background: pick === p ? 'var(--color-background-selected, rgba(28,79,58,0.07))' : 'transparent' }}>
                    <Text weight={pick === p ? 'bold' : 'regular'}>{p.name}</Text>
                    <Text type="supporting" color="secondary">
                      {won(p.amt)} ({cell.amt ? (p.amt / cell.amt * 100).toFixed(1) : 0}%) · {comma(p.cnt)}건 · 수량 {comma(p.qty)}
                    </Text>
                  </div>
                ))}
              </div>
              <Stack gap={2}>
                {pick ? (
                  <>
                    <Text type="label" weight="semibold">{pick.name} — 추적코드 비율</Text>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pick.byChannel.slice(0, 8)} dataKey="amt" nameKey="name"
                             innerRadius={44} outerRadius={74} paddingAngle={1.5} strokeWidth={0}>
                          {pick.byChannel.slice(0, 8).map((r, i) => <Cell key={r.name} fill={ROUTE_COLORS[i % ROUTE_COLORS.length]} />)}
                        </Pie>
                        <RTooltip formatter={(v, n) => [`${won(v)} (${pick.amt ? (v / pick.amt * 100).toFixed(1) : 0}%)`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Table data={pick.byChannel} idKey="name" density="compact" dividers="rows"
                           columns={[
                             { key: 'name', header: '추적코드' },
                             { key: 'amt', header: '매출', renderCell: (r) => `${won(r.amt)} (${pick.amt ? (r.amt / pick.amt * 100).toFixed(1) : 0}%)` },
                           ]} />
                  </>
                ) : <Text color="secondary">좌측에서 상품을 선택하세요.</Text>}
              </Stack>
            </div>
          </LayoutContent>
        }
      />
    </Dialog>
  )
}

function GradeProductChannelsDialog({ grade, prod, onClose }) {
  return (
    <DonutTableDialog
      title={`${grade} · ${prod.name}`}
      subtitle={`매출 ${won(prod.amt)} · 주문 ${comma(prod.cnt)}건 · 수량 ${comma(prod.qty)}`}
      rows={prod.channels} total={prod.amt} onClose={onClose} />
  )
}

export function ClassRulesDialog({ classMap, rules, onChange, onClose }) {
  const [tab, setTab] = useState(EXT_CLASSES[0])
  const inventory = useMemo(() => {
    const counts = new Map()
    for (const v of classMap.values()) {
      const joined = v.tokens.join('|')
      if (BASE_CLASSES.some((c) => c.re.test(joined))) continue
      for (const t of new Set(v.tokens)) counts.set(t, (counts.get(t) || 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [classMap])
  const assignedTo = (token) => EXT_CLASSES.find((cls) => (rules[cls] || []).includes(token)) || null
  const clsCount = (cls) => { let n = 0; for (const v of classMap.values()) if (v.cls === cls) n++; return n }
  const leftover = useMemo(() => { let n = 0; for (const v of classMap.values()) if (v.cls === '기타') n++; return n }, [classMap])
  const toggle = (token) => {
    const cur = assignedTo(token)
    const next = { ...rules }
    if (cur === tab) next[tab] = (next[tab] || []).filter((t) => t !== token)
    else {
      if (cur) next[cur] = (next[cur] || []).filter((t) => t !== token)
      next[tab] = [...(next[tab] || []), token]
    }
    onChange(next)
  }
  const assignedCount = inventory.filter(([t]) => assignedTo(t)).length
  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) onClose() }} width={980} maxHeight="88vh">
      <Layout
        header={<DialogHeader title="분류 확장 설정"
                              subtitle={`'기타'로 잡힌 상품의 태그·카테고리를 클릭해 새 분류로 배정 — 기타 ${comma(leftover)}개 남음`}
                              onOpenChange={(open) => { if (!open) onClose() }} />}
        content={
          <LayoutContent>
            <Stack gap={3}>
              <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                <TabList value={tab} onChange={setTab} size="sm">
                  {EXT_CLASSES.map((cls) => <Tab key={cls} value={cls} label={`${cls} ${comma(clsCount(cls))}`} />)}
                </TabList>
                <div style={{ flex: 1 }} />
                <Badge variant="green" label={`배정 완료 ${comma(assignedCount)}개 칩`} />
              </Stack>
              <Text type="supporting" color="secondary">
                칩 클릭 = '{tab}'에 배정 (색 칠해짐) · 재클릭 = 해제 · 다른 분류에 배정된 칩을 누르면 '{tab}'(으)로 이동 · 자동 저장
              </Text>
              <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
                <Stack direction="horizontal" gap={1} wrap="wrap">
                  {inventory.map(([token, n]) => {
                    const cur = assignedTo(token)
                    const on = cur === tab
                    return (
                      <span key={token} onClick={() => toggle(token)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              border: '1.5px solid ' + (on ? '#7d6b9e' : 'var(--color-border)'),
                              background: on ? '#7d6b9e' : cur ? 'var(--color-background-muted, #eee)' : 'var(--color-background-card)',
                              color: on ? '#fff' : 'var(--color-text-primary)',
                              borderRadius: 999, padding: '4px 12px', fontSize: 12.5, cursor: 'pointer',
                              margin: 2, fontWeight: on ? 600 : 400,
                            }}>
                        {token} <small style={{ opacity: 0.75 }}>{comma(n)}</small>
                        {cur && <span style={{ fontSize: 11, opacity: 0.85 }}>· {cur}</span>}
                      </span>
                    )
                  })}
                </Stack>
              </div>
            </Stack>
          </LayoutContent>
        }
      />
    </Dialog>
  )
}

// 시간대별 주문 분석 카드 (v49 · 드릴2 통합판)
function HourlyOrdersCard({ tagInfo, cube }) {
  const [unit, setUnit] = useState(3)
  const [mode, setMode] = useState('all')
  const [dayIdx, setDayIdx] = useState(-1)
  const [memF, setMemF] = useState('all')
  const [chF, setChF] = useState('all')
  const [selHour, setSelHour] = useState(null)
  const [selGrp, setSelGrp] = useState(null)

  const live = !!tagInfo
  const hasTime = live ? tagInfo.hasTime : !!cube?.hasTime
  const hasMemberCol = live ? tagInfo.hasMemberCol : !!cube?.hasMemberCol
  const days = useMemo(() => {
    if (!live) return []
    return [...new Set(tagInfo.tags.map((t) => t.day))].sort()
  }, [tagInfo, live])
  const dailyOn = mode === 'daily' && live && days.length > 0
  const curDay = dailyOn ? days[dayIdx < 0 ? days.length - 1 : dayIdx] : null
  const src49 = live ? { tags: tagInfo.tags } : { cube }

  const agg = useMemo(() => hourlyBuckets(src49, unit, memF, chF, curDay),
    [tagInfo, cube, unit, memF, chF, curDay])
  const drillRows = selHour
    ? hourlyDrill(src49, unit, selHour.start, memF, chF, curDay)
    : null

  if (!hasTime) {
    return (
      <SnapCard>
        <Stack gap={1}>
          <Text type="label" weight="semibold">시간대별 주문 분석</Text>
          <Banner status="info" title="시간 정보 없음"
                  description="주문일 컬럼에 시각(HH:MM)이 없는 파일이에요 — 시간 포함 내보내기로 다시 받아주세요." />
        </Stack>
      </SnapCard>
    )
  }
  const filterLabel = [
    memF === 'm' ? '회원만' : memF === 'n' ? '비회원만' : null,
    chF === 'pure' ? '순수 APP' : null,
    curDay,
  ].filter(Boolean).join(' · ')
  const donut = agg.rows.filter((r) => r.cnt > 0)
  const moveDay = (d) => {
    const cur = dayIdx < 0 ? days.length - 1 : dayIdx
    const next = Math.min(days.length - 1, Math.max(0, cur + d))
    setDayIdx(next)
  }
  return (
    <SnapCard>
      <Stack gap={2}>
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          <Text type="label" weight="semibold">시간대별 주문 분석</Text>
          <Text type="supporting" color="secondary">주문일시의 시(hour) 기준 · 조각/행 클릭 = 채널 비중</Text>
          {agg.total > 0 && agg.total < 30 && <Badge variant="warning" label={`표본 적음 (${comma(agg.total)}건)`} />}
        </Stack>
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          <TabList value={String(unit)} onChange={(v) => setUnit(+v)} size="sm">
            <Tab value="1" label="1시간" /><Tab value="2" label="2시간" /><Tab value="3" label="3시간" />
          </TabList>
          <TabList value={mode} onChange={(v) => { setMode(v); setDayIdx(-1) }} size="sm">
            <Tab value="all" label="전체 합산" />
            <Tab value="daily" label="일별 탐색" />
          </TabList>
          {hasMemberCol && (
            <TabList value={memF} onChange={setMemF} size="sm">
              <Tab value="all" label="전체" /><Tab value="m" label="회원만" /><Tab value="n" label="비회원만" />
            </TabList>
          )}
          <TabList value={chF} onChange={setChF} size="sm">
            <Tab value="all" label="전체 채널" /><Tab value="pure" label="순수 APP만" />
          </TabList>
        </Stack>
        {mode === 'daily' && !live && (
          <Text type="supporting" color="secondary">일별 탐색은 원본 파일을 다시 업로드하면 쓸 수 있어요 (저장본은 전체 합산만).</Text>
        )}
        {dailyOn && (
          <Stack direction="horizontal" gap={2} vAlign="center">
            <Button label="◀" variant="ghost" size="sm" isDisabled={(dayIdx < 0 ? days.length - 1 : dayIdx) === 0}
                    clickAction={() => moveDay(-1)} />
            <Text weight="semibold">{curDay}</Text>
            <Button label="▶" variant="ghost" size="sm" isDisabled={(dayIdx < 0 ? days.length - 1 : dayIdx) === days.length - 1}
                    clickAction={() => moveDay(1)} />
            <Text type="supporting" color="secondary">({(dayIdx < 0 ? days.length : dayIdx + 1)}/{days.length}일)</Text>
          </Stack>
        )}
        {agg.total === 0 ? (
          <Text color="secondary">조건에 맞는 주문이 없어요.</Text>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.1fr) 1fr', gap: 16, alignItems: 'start' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={donut} dataKey="cnt" nameKey="name" innerRadius={64} outerRadius={110}
                     paddingAngle={unit === 1 ? 0.5 : 1.5} strokeWidth={0}
                     label={unit === 1 ? false : (e) => `${e.name} ${e.pct.toFixed(0)}%`}
                     labelLine={unit !== 1}
                     onClick={(e) => e && setSelHour({ start: e.start, label: e.name })}
                     style={{ cursor: 'pointer' }}>
                  {donut.map((r) => <Cell key={r.name} fill={hourColor(r.start, unit)} />)}
                </Pie>
                <RTooltip formatter={(v, n, e) => [`${comma(v)}건 (${e?.payload?.pct.toFixed(1)}%)`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Table data={agg.rows} idKey="name" density="compact" dividers="rows"
                     columns={[
                       { key: 'name', header: '시간대', renderCell: (r) => r.cnt ? (
                           <span onClick={() => setSelHour({ start: r.start, label: r.name })}
                                 style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                             {r.name}
                           </span>
                         ) : r.name },
                       { key: 'cnt', header: '건수', renderCell: (r) => comma(r.cnt) + '건' },
                       { key: 'pct', header: '비중', renderCell: (r) => r.pct.toFixed(1) + '%' },
                     ]} />
            </div>
          </div>
        )}
        {selHour && drillRows && (
          <DonutTableDialog
            title={`${selHour.label} 주문 — 채널 그룹 비중`}
            subtitle={`${comma(drillRows.reduce((s, r) => s + r.amt, 0))}건${filterLabel ? ' · ' + filterLabel : ''} · 그룹명 클릭 = 추적코드 비율`}
            rows={drillRows} total={drillRows.reduce((s, r) => s + r.amt, 0)}
            unitLabel="채널 그룹" valueLabel="주문 건수" fmt={(v) => comma(v) + '건'}
            onRowClick={(r) => setSelGrp(r.name)}
            onClose={() => { setSelHour(null); setSelGrp(null) }} />
        )}
        {selHour && selGrp && (() => {
          const rows2 = hourlyDrill2(src49, unit, selHour.start, selGrp, memF, chF, curDay)
          const tot2 = rows2.reduce((s, r) => s + r.amt, 0)
          return (
            <DonutTableDialog
              title={`${selHour.label} · ${selGrp} — 추적코드 비율`}
              subtitle={`${comma(tot2)}건${filterLabel ? ' · ' + filterLabel : ''}`}
              rows={rows2} total={tot2}
              unitLabel="추적코드" valueLabel="주문 건수" fmt={(v) => comma(v) + '건'}
              onClose={() => setSelGrp(null)} />
          )
        })()}
      </Stack>
    </SnapCard>
  )
}

export function OrdersResults({ parsed, classMap, rules, onRulesChange }) {
  const restoredView = parsed.restored ? parsed.view : null
  const [showRaw, setShowRaw] = useState(false)
  const [allProds, setAllProds] = useState(false)
  const [allCh, setAllCh] = useState(false)
  const [selProd, setSelProd] = useState(null)
  const [selCh, setSelCh] = useState(null)
  const [codeFilter, setCodeFilter] = useState(() => restoredView?.codeFilter || [])
  const [codeFilterOpen, setCodeFilterOpen] = useState(false)
  const [dateOn, setDateOn] = useState(() => !!restoredView?.rangeA)
  const [dateRange, setDateRange] = useState(() => restoredView?.rangeA || null)
  const [cmpOn, setCmpOn] = useState(() => !!restoredView?.rangeB)
  const [rangeB, setRangeB] = useState(() => restoredView?.rangeB || null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [matrixMetric, setMatrixMetric] = useState('amt')
  const [selGroup, setSelGroup] = useState(null)
  const [selCell, setSelCell] = useState(null)
  const [gradeTab, setGradeTab] = useState(null)
  const [selGradeProd, setSelGradeProd] = useState(null)

  // 주문일 컬럼 위치 + 파일의 날짜 범위
  const dateIdx = useMemo(
    () => parsed.headers.findIndex((h) => String(h).replace(/\s+/g, '') === '주문일'),
    [parsed]
  )
  const dataSpan = useMemo(() => {
    if (dateIdx < 0) return null
    let min = null, max = null
    for (const r of parsed.data) {
      const d = String(r[dateIdx] || '').slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue
      if (!min || d < min) min = d
      if (!max || d > max) max = d
    }
    return min ? { min, max } : null
  }, [parsed, dateIdx])

  // 기간 필터 적용 시 재집계 (주문일 기준)
  // 원본 행이 있을 때만 필터 재계산 — 저장본 복원(빈 data)에선 저장된 analysis를 그대로 사용
  const hasRawRows = parsed.data.length > 0
  const dateActive = hasRawRows && dateOn && dateIdx >= 0 && dateRange?.start && dateRange?.end
  const cmpActive = hasRawRows && cmpOn && dateIdx >= 0 && rangeB?.start && rangeB?.end
  const rowsIn = (rg) => parsed.data.filter((r) => {
    const d = String(r[dateIdx] || '').slice(0, 10)
    return d >= rg.start && d <= rg.end
  })
  const a = useMemo(() => {
    if (!dateActive) return parsed.analysis
    return analyzeOrders(parsed.headers, rowsIn(dateRange))
  }, [parsed, dateActive, dateRange, dateIdx])
  const b = useMemo(() => {
    if (!cmpActive) return null
    return analyzeOrders(parsed.headers, rowsIn(rangeB))
  }, [parsed, cmpActive, rangeB, dateIdx])
  const rowsA = useMemo(() => {
    if (!parsed.data.length) return null
    return dateActive ? rowsIn(dateRange) : parsed.data
  }, [parsed, dateActive, dateRange, dateIdx])
  const matrix = useMemo(() => {
    if (parsed.restored) return parsed.matrix || null
    if (!classMap || !rowsA) return null
    return computeChannelCategoryMatrix(parsed.headers, rowsA, classMap)
  }, [parsed, classMap, rowsA, rules])
  // 시간대별 주문 태깅 (기간 A 연동)
  const hourTags = useMemo(() => {
    if (parsed.restored) return null
    if (!rowsA) return null
    return computeHourlyTags(parsed.headers, rowsA)
  }, [parsed, rowsA])
  const hourCube = useMemo(() => {
    if (parsed.restored) return parsed.hourly || null
    return hourlyCubeFromTags(hourTags)
  }, [parsed, hourTags])
  // 등급별 수요 상품 TOP 30 (기간 A 연동)
  const gradeProducts = useMemo(() => {
    if (parsed.restored) return parsed.gradeProducts || null
    if (!rowsA) return null
    return computeGradeProducts(parsed.headers, rowsA)
  }, [parsed, rowsA])
  const gradeTabCur = gradeTab && gradeProducts?.some((g) => g.grade === gradeTab)
    ? gradeTab : gradeProducts?.[0]?.grade || null
  // 스냅샷 갱신
  useEffect(() => {
    if (parsed.restored) return
    registerSnap('orders', {
      headers: parsed.headers, sheet: parsed.sheet, data: [],
      rowCount: parsed.data.length, dup: parsed.dup, fname: parsed.fname,
      analysis: a, analysisB: b,
      matrix: trimMatrixForSnap(matrix), gradeProducts: trimGradeProductsForSnap(gradeProducts),
      hourly: hourCube,
      view: { rangeA: dateActive ? dateRange : null, rangeB: cmpActive ? rangeB : null, codeFilter },
      restored: true,
    })
  }, [parsed, a, b, matrix, gradeProducts, hourCube, dateActive, dateRange, cmpActive, rangeB, codeFilter])
  const bA = parsed.restored ? parsed.analysisB || null : b
  const bMap = (arr) => { const m = new Map(); (arr || []).forEach((r) => m.set(r.name, r)); return m }
  const bRoutes = bA ? bMap(bA.routesAll) : null
  const bMembers = bA ? bMap(bA.members) : null
  const bGrades = bA ? bMap(bA.grades) : null
  const bProducts = bA ? bMap(bA.products) : null
  // 필터 활성 시: 선택한 추적코드에서 발생한 매출·주문수·수량·이익만으로 재계산
  const filteredProducts = a && codeFilter.length
    ? a.products
        .map((p) => {
          const hits = (p.byChannel || []).filter((c) => codeFilter.includes(c.name))
          if (!hits.length) return null
          const sum = (k) => hits.reduce((s, h) => s + (h[k] || 0), 0)
          return { ...p, amt: sum('amt'), qty: sum('qty'), profit: sum('profit'), cnt: sum('cnt'),
                   byChannel: hits, full: p }
        })
        .filter(Boolean)
        .sort((x, y) => y.amt - x.amt)
    : a?.products || []

  const previewCols = parsed.headers.slice(0, 8)
  const previewRows = parsed.data.slice(0, 10).map((r, i) => {
    const o = { _id: i }
    previewCols.forEach((h, ci) => { o[`c${ci}`] = String(r[ci] ?? '') })
    return o
  })

  return (
    <Stack gap={4}>
      {parsed.restored && (
        <Banner status="info" title="저장된 분석 결과"
                description={
                  restoredView?.rangeA && restoredView?.rangeB
                    ? `스냅샷 복원 — 기간 A ${restoredView.rangeA.start}~${restoredView.rangeA.end} · 기간 B ${restoredView.rangeB.start}~${restoredView.rangeB.end} 기준. 기간을 다시 자르려면 원본 파일을 업로드하세요.`
                    : restoredView?.rangeA
                    ? `스냅샷 복원 — 기간 ${restoredView.rangeA.start}~${restoredView.rangeA.end} 기준. 기간을 다시 자르려면 원본 파일을 업로드하세요.`
                    : '스냅샷에서 복원된 분석이에요. 기간 필터와 컬럼 미리보기는 원본 파일을 다시 업로드하면 쓸 수 있어요.'
                } />
      )}
      {dateIdx >= 0 && !parsed.restored && (
        <Card padding={3}>
          <Stack direction="horizontal" gap={3} vAlign="end" wrap="wrap">
            {dateOn ? (
              <>
                <DateRangeInput label="기간 필터 A (주문일 기준)" value={dateRange} onChange={setDateRange} presets={PRESETS} />
                {cmpOn ? (
                  <>
                    <DateRangeInput label="비교기간 B" value={rangeB} onChange={setRangeB} presets={PRESETS} />
                    <Button label="비교 제거" variant="ghost" clickAction={() => { setCmpOn(false); setRangeB(null) }} />
                  </>
                ) : (
                  <Button label="+ 비교기간 추가" variant="secondary" clickAction={() => {
                    if (!rangeB && dateRange?.start && dateRange?.end) {
                      const n = dayCount(dateRange.start, dateRange.end)
                      setRangeB({ start: shiftDays(dateRange.start, -n), end: shiftDays(dateRange.end, -n) })
                    }
                    setCmpOn(true)
                  }} />
                )}
                <Button label="필터 해제" variant="ghost" clickAction={() => { setDateOn(false); setDateRange(null); setCmpOn(false); setRangeB(null) }} />
              </>
            ) : (
              <Button label="+ 기간 필터 (주문일 기준)" variant="secondary" clickAction={() => setDateOn(true)} />
            )}
            <Text type="supporting" color="secondary">
              파일 데이터 범위: {dataSpan ? `${dataSpan.min} ~ ${dataSpan.max}` : '확인 불가'}
              {dateActive && a ? ` · 기간 내 ${comma(a.totalRows)}행 집계 중` : ''}
            </Text>
          </Stack>
        </Card>
      )}

      {!a && (
        <Banner status="warning" title="분석에 필요한 컬럼을 찾지 못했어요"
                description="'결제 금액' 컬럼이 있는 주문 데이터 형식인지 확인해주세요. 아래 인식된 컬럼 목록을 캡처해서 공유해주시면 맞출게요." />
      )}

      {a && (
        <>
          <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={3}>
            <Kpi label="유효 주문" value={comma(a.totalCnt) + '건'}
                 badge={bA ? <DeltaBadge cur={a.totalCnt} prev={bA.totalCnt} label="기간 B 대비" /> : null}
                 sub={bA ? null : a.isItemLevel ? `상품행 ${comma(a.totalRows)}건 · 제외 기준 동일` : '취소·휴지통·미입금 제외'} />
            <Kpi label="매출 (잔여 결제 기준)" value={won(a.totalAmt)}
                 badge={bA ? <DeltaBadge cur={a.totalAmt} prev={bA.totalAmt} label="기간 B 대비" /> : null}
                 sub={bA ? null : '부분취소 반영'} />
            <Kpi label="객단가" value={a.totalCnt ? won(Math.round(a.totalAmt / a.totalCnt)) : '–'}
                 badge={bA && bA.totalCnt ? <DeltaBadge cur={a.totalCnt ? a.totalAmt / a.totalCnt : 0} prev={bA.totalAmt / bA.totalCnt} label="기간 B 대비" /> : null} />
            <Kpi label="제외 처리" value={comma(a.excluded) + '건'} />
          </Grid>

          {/* 1. 주문 경로 비중 — 1열 */}
          <Stack gap={3}>
            <DonutCard title="주문 경로 비중 (매출)" rows={a.routes} totalAmt={a.totalAmt}
                       colorOf={(r, i) => ROUTE_COLORS[i % ROUTE_COLORS.length]}
                       extra={a.routes.find((r) => r.sub) && (
                         <Text type="supporting" color="secondary">
                           기타: {a.routes.find((r) => r.sub).sub.join(', ')}
                         </Text>
                       )} />
            <SnapCard>
              <Stack gap={2}>
                <Text type="label" weight="semibold">주문 경로 상세{bA ? ' — A/B 비교' : ''}</Text>
                <ShareTable rows={a.routesAll} totalAmt={a.totalAmt} totalCnt={a.totalCnt} bmap={bRoutes} />
              </Stack>
            </SnapCard>
          </Stack>

          {/* 2. 회원/비회원 비중 — 1열 */}
          <Stack gap={3}>
            <DonutCard title="회원 / 비회원 비중 (매출)" rows={a.members} totalAmt={a.totalAmt}
                       colorOf={(r) => r.name === '회원' ? '#1c4f3a' : '#b8b3a6'} />
            <SnapCard>
              <Stack gap={2}>
                <Text type="label" weight="semibold">회원 / 비회원 상세{bA ? ' — A/B 비교' : ''}</Text>
                <ShareTable rows={a.members} totalAmt={a.totalAmt} totalCnt={a.totalCnt} withAov bmap={bMembers} />
              </Stack>
            </SnapCard>
          </Stack>

          {/* 3. 등급별 매출/주문건수 — 1열, A/B */}
          <Stack gap={3}>
            <SnapCard>
              <Stack gap={2}>
                <Text type="label" weight="semibold">등급별 매출{bA ? ' — A/B' : ''}</Text>
                <ResponsiveContainer width="100%" height={Math.max(200, a.grades.length * (bA ? 56 : 40))}>
                  <BarChart data={a.grades.map((g) => ({ ...g, amtB: bGrades?.get(g.name)?.amt ?? null }))}
                            layout="vertical" margin={{ top: 4, right: 76, left: 8, bottom: 4 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={64} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <RTooltip content={<ChartTip />} cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
                    {bA && <Legend iconType="circle" iconSize={9}
                            formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v === 'amt' ? '기간 A' : '기간 B'}</span>} />}
                    <Bar dataKey="amt" radius={[0, 4, 4, 0]} maxBarSize={20}>
                      {a.grades.map((g) => <Cell key={g.name} fill={GRADE_COLORS[g.name] || '#97a3a0'} />)}
                      <LabelList dataKey="amt" position="right" formatter={manwon}
                                 style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                    </Bar>
                    {bA && (
                      <Bar dataKey="amtB" fill="var(--ch-kakao, #e6b422)" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        <LabelList dataKey="amtB" position="right" formatter={(v) => v == null ? '' : manwon(v)}
                                   style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </Stack>
            </SnapCard>
            <SnapCard>
              <Stack gap={2}>
                <Text type="label" weight="semibold">등급별 상세{bA ? ' — A/B 비교' : ''}</Text>
                <ShareTable rows={a.grades} totalAmt={a.totalAmt} totalCnt={a.totalCnt} withAov bmap={bGrades} />
              </Stack>
            </SnapCard>
          </Stack>

          {/* 3.5 등급별 수요 상품 TOP 30 */}
          {gradeProducts && gradeProducts.length > 0 && (
            <SnapCard>
              <Stack gap={2}>
                <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                  <Text type="label" weight="semibold">등급별 수요 상품 TOP 30</Text>
                  <Text type="supporting" color="secondary">기간 A 기준 · 상품명 클릭 = 추적코드 비중</Text>
                </Stack>
                <TabList value={gradeTabCur} onChange={setGradeTab} size="sm">
                  {gradeProducts.map((g) => <Tab key={g.grade} value={g.grade} label={`${g.grade} ${manwon(g.amt)}`} />)}
                </TabList>
                <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                  <Table
                    data={(gradeProducts.find((g) => g.grade === gradeTabCur)?.products || []).map((p, i) => ({ ...p, rank: i + 1 }))}
                    idKey="name" density="compact" dividers="rows" textOverflow="truncate"
                    columns={[
                      { key: 'rank', header: '#' },
                      { key: 'code', header: '상품코드', renderCell: (r) => (
                          <Text type="supporting" color="secondary">{r.code || '–'}</Text>
                        ) },
                      { key: 'name', header: '상품명', renderCell: (r) => (
                          <span onClick={() => setSelGradeProd(r)}
                                style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                            {r.name}
                          </span>
                        ) },
                      { key: 'amt', header: '매출', renderCell: (r) => {
                          const g = gradeProducts.find((x) => x.grade === gradeTabCur)
                          return `${won(r.amt)} (${g?.amt ? (r.amt / g.amt * 100).toFixed(1) : 0}%)`
                        } },
                      { key: 'cnt', header: '주문수', renderCell: (r) => comma(r.cnt) },
                      { key: 'qty', header: '수량', renderCell: (r) => comma(r.qty) },
                    ]}
                  />
                </div>
              </Stack>
            </SnapCard>
          )}

          {/* 3.7 채널 그룹 × 카테고리 매트릭스 */}
          {matrix && matrix.rows.length > 0 && (
            <SnapCard>
              <Stack gap={2}>
                <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                  <Text type="label" weight="semibold">채널 그룹 × 카테고리</Text>
                  <Text type="supporting" color="secondary">
                    그룹명 클릭 = 추적코드 비중 · 금액 클릭 = 상품 상세
                  </Text>
                  <div style={{ flex: 1 }} />
                  {classMap && !parsed.restored && (
                    <Button label="분류 확장 설정" variant="ghost" size="sm" clickAction={() => setRulesOpen(true)} />
                  )}
                  <TabList value={matrixMetric} onChange={setMatrixMetric} size="sm">
                    <Tab value="amt" label="매출" />
                    <Tab value="cnt" label="주문건수" />
                  </TabList>
                </Stack>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '2px solid var(--color-border)' }}>채널 그룹</th>
                        <th style={{ textAlign: 'right', padding: '7px 10px', borderBottom: '2px solid var(--color-border)' }}>합계</th>
                        {matrix.classes.map((cls) => (
                          <th key={cls} style={{ textAlign: 'right', padding: '7px 10px', borderBottom: '2px solid var(--color-border)' }}>{cls}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.rows.map((row) => (
                        <tr key={row.group}>
                          <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--color-border)' }}>
                            <span onClick={() => setSelGroup(row)}
                                  style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                              {row.group}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', padding: '7px 10px', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>
                            {matrixMetric === 'amt' ? manwon(row.amt) : comma(row.cnt) + '건'}
                          </td>
                          {matrix.classes.map((cls) => {
                            const cell = row.byClass[cls]
                            if (!cell) return <td key={cls} style={{ textAlign: 'right', padding: '7px 10px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>–</td>
                            const pct = row.amt ? (cell.amt / row.amt * 100).toFixed(0) : 0
                            return (
                              <td key={cls} style={{ textAlign: 'right', padding: '7px 10px', borderBottom: '1px solid var(--color-border)' }}>
                                <span onClick={() => setSelCell({ group: row.group, cls, cell })}
                                      style={{ cursor: 'pointer', color: 'var(--color-text-accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                                  {matrixMetric === 'amt' ? manwon(cell.amt) : comma(cell.cnt) + '건'}
                                </span>
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}> {pct}%</span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Stack>
            </SnapCard>
          )}
          {!matrix && classMap && (
            <Banner status="info" title="매트릭스 준비됨"
                    description="상품 데이터 분류 매핑 완료 — 주문서 데이터와 함께 분석돼요." />
          )}

          {/* 3.8 시간대별 주문 분석 */}
          {(hourTags || hourCube) && <HourlyOrdersCard tagInfo={hourTags} cube={hourCube} />}

          {/* 4. 상품별 TOP */}
          {a.products.length > 0 && (
            <SnapCard>
              <Stack gap={2}>
                <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                  <Text type="label" weight="semibold">상품별 매출 TOP</Text>
                  <Text type="supporting" color="secondary">잔여 결제 금액 · 옵션 합산</Text>
                  <div style={{ flex: 1 }} />
                  {codeFilter.length > 0 && (
                    <Badge variant="success" label={`추적코드 필터 ${codeFilter.length}개 · ${comma(filteredProducts.length)}개 상품 · 선택 코드 기준 재계산`} />
                  )}
                  {filteredProducts.length > 20 && (
                    <Button label={allProds ? '상위 20개만' : `전체 보기 (${filteredProducts.length}개)`}
                            variant="ghost" size="sm" clickAction={() => setAllProds(!allProds)} />
                  )}
                </Stack>
                <Text type="supporting" color="secondary">상품명 클릭 = 채널 비중 · '주요 추적코드' 헤더 클릭 = 추적코드 필터</Text>
                <RankTable rows={allProds ? filteredProducts : filteredProducts.slice(0, 20)}
                           totalAmt={a.totalAmt} unit="상품명" onPick={(r) => setSelProd(r.full || r)}
                           onTopCodeClick={() => setCodeFilterOpen(true)}
                           topCodeFilterCount={codeFilter.length}
                           bmap={codeFilter.length ? null : bProducts} />
              </Stack>
            </SnapCard>
          )}

          {/* 5. 추적코드별 실적 */}
          {a.channels.length > 0 && (
            <SnapCard>
              <Stack gap={2}>
                <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                  <Text type="label" weight="semibold">추적코드별 실적</Text>
                  <Text type="supporting" color="secondary">채널명 컬럼 기준</Text>
                  <div style={{ flex: 1 }} />
                  {a.channels.length > 20 && (
                    <Button label={allCh ? '상위 20개만' : `전체 보기 (${a.channels.length}개)`}
                            variant="ghost" size="sm" clickAction={() => setAllCh(!allCh)} />
                  )}
                </Stack>
                <Text type="supporting" color="secondary">추적코드를 클릭하면 구매 회원 등급 비중을 볼 수 있어요.</Text>
                <RankTable rows={allCh ? a.channels : a.channels.slice(0, 20)}
                           totalAmt={a.totalAmt} unit="추적코드" onPick={setSelCh} />
              </Stack>
            </SnapCard>
          )}
        </>
      )}

      {selProd && <ProductDetailDialog prod={selProd} totalAmt={a?.totalAmt} onClose={() => setSelProd(null)} />}
      {selCh && <ChannelDetailDialog ch={selCh} totalAmt={a?.totalAmt} onClose={() => setSelCh(null)} />}
      {selGroup && (
        <DonutTableDialog title={selGroup.group} subtitle={`매출 ${won(selGroup.amt)} · 주문 ${comma(selGroup.cnt)}건 — 그룹 내 추적코드 비중`}
                          rows={selGroup.codes} total={selGroup.amt} onClose={() => setSelGroup(null)} />
      )}
      {selCell && <CellProductsDialog cell={selCell.cell} group={selCell.group} cls={selCell.cls}
                                      onClose={() => setSelCell(null)} />}
      {selGradeProd && <GradeProductChannelsDialog grade={gradeTabCur} prod={selGradeProd}
                                                   onClose={() => setSelGradeProd(null)} />}
      {rulesOpen && classMap && (
        <ClassRulesDialog classMap={classMap} rules={rules} onChange={onRulesChange}
                          onClose={() => setRulesOpen(false)} />
      )}
      {codeFilterOpen && (
        <Dialog isOpen onOpenChange={(open) => { if (!open) setCodeFilterOpen(false) }} width={560} maxHeight="80vh">
          <Layout
            header={<DialogHeader title="추적코드로 상품 필터"
                                  subtitle="선택한 추적코드에서 판매된 상품만 표시해요 (다중 선택)"
                                  onOpenChange={(open) => { if (!open) setCodeFilterOpen(false) }} />}
            content={
              <LayoutContent>
                <Stack gap={3}>
                  <MultiSelector
                    label={`추적코드 (${codeFilter.length}개 선택됨)`}
                    options={(a?.channels || []).map((c) => c.name)}
                    value={codeFilter}
                    onChange={setCodeFilter}
                    hasSelectAll
                    hasSearch
                    searchPlaceholder="추적코드 이름으로 검색…"
                  />
                  <Stack direction="horizontal" gap={2}>
                    <Button label="적용하고 닫기" variant="primary" clickAction={() => setCodeFilterOpen(false)} />
                    <Button label="필터 초기화" variant="ghost" clickAction={() => setCodeFilter([])} />
                  </Stack>
                </Stack>
              </LayoutContent>
            }
          />
        </Dialog>
      )}

      <SnapCard>
        <Stack gap={2}>
          <Stack direction="horizontal" gap={2} vAlign="center">
            <Text type="label" weight="semibold">파일 구조</Text>
            <Text type="supporting" color="secondary">
              {parsed.fname} · {parsed.sheet} · {comma(parsed.rowCount ?? parsed.data.length)}행 · {parsed.headers.length}컬럼{parsed.dup > 0 ? ` · 중복 ${comma(parsed.dup)}행 제거됨` : ''}
            </Text>
            <div style={{ flex: 1 }} />
            <Button label={showRaw ? '접기' : '컬럼·미리보기 펼치기'} variant="ghost" size="sm"
                    clickAction={() => setShowRaw(!showRaw)} />
          </Stack>
          {showRaw && (
            <>
              <Stack direction="horizontal" gap={1} wrap="wrap">
                {parsed.headers.map((h, i) => h && <Badge key={i} variant="neutral" label={h} />)}
              </Stack>
              <div style={{ overflowX: 'auto' }}>
                <Table data={previewRows} idKey="_id" density="compact" dividers="grid" textOverflow="truncate"
                       columns={previewCols.map((h, ci) => ({ key: `c${ci}`, header: h || `(${ci + 1}열)` }))} />
              </div>
            </>
          )}
        </Stack>
      </SnapCard>
    </Stack>
  )
}

function OrdersSection() {
  const [files, setFiles] = useState([])
  const [prodFiles, setProdFiles] = useState([])
  const [error, setError] = useState(null)
  const [parsed, setParsed] = useState(() => restoredOf('orders'))
  const [classMap, setClassMap] = useState(null)
  const [rules, setRules] = useState(() => (typeof window !== 'undefined' ? loadClassRules() : {}))
  const [busy, setBusy] = useState(false)
  const [prog, setProg] = useState({ msg: '', done: 0, total: 0 })

  const onFiles = async (fs) => {
    const list = !fs ? [] : Array.isArray(fs) ? fs : [fs]
    setFiles(list); setError(null); setParsed(null)
    if (!list.length) return
    setBusy(true); setProg({ msg: '파일 병렬 파싱 중…', done: 0, total: list.length })
    try {
      const parsedList = await parseFilesParallel(list, (name) =>
        setProg((p) => ({ ...p, done: p.done + 1, msg: `${name} 완료` })))
      const merged = mergeParsedFiles(parsedList)
      const analysis = analyzeOrders(merged.headers, merged.data)
      setParsed({ ...merged, analysis })
      registerSnap('orders', { headers: merged.headers, sheet: merged.sheet, data: [],
                               rowCount: merged.data.length, dup: merged.dup,
                               fname: merged.fname, analysis, restored: true })
    } catch (e) { setError(e.message || String(e)) }
    finally { setBusy(false) }
  }

  const onProdFiles = async (fs) => {
    const list = !fs ? [] : Array.isArray(fs) ? fs : [fs]
    setProdFiles(list)
    if (!list.length) { setClassMap(null); return }
    setBusy(true); setProg({ msg: '상품 데이터 파싱 중…', done: 0, total: list.length })
    try {
      const parsedList = await parseFilesParallel(list, (name) =>
        setProg((p) => ({ ...p, done: p.done + 1, msg: `${name} 완료` })))
      const rows = []
      for (const p of parsedList) { rows.push(p.headers); for (const r of p.data) rows.push(r) }
      setClassMap(buildProductClassMap([], rows, rules))
    } catch (e) { setError(e.message || String(e)) }
    finally { setBusy(false) }
  }

  const onRulesChange = (next) => {
    setRules(next); saveClassRules(next)
    if (classMap) setClassMap(reclassifyMap(classMap, next))
  }

  return (
    <Stack gap={4}>
{!VIEWER && (<>
      <Card padding={3}>
        <Stack gap={3}>
          <FileInput
            label="주문서 파일 업로드 (여러 개 가능)"
            description="FLEXG 주문 데이터 내보내기 (.xls / .xlsx / .csv) — 분할 내보내기는 파일들을 한꺼번에 선택하면 자동 병합돼요. 브라우저 안에서만 읽고 외부 전송 없음"
            value={files}
            onChange={onFiles}
            accept=".xls,.xlsx,.csv"
            mode="dropzone"
            isMultiple
          />
          <FileInput
            label="상품 데이터 (선택) — 채널 그룹 × 카테고리 분석"
            description="FLEXG 상품 내보내기 엑셀을 추가하면 상품코드→분류 매핑으로 매트릭스 분석이 열려요"
            value={prodFiles}
            onChange={onProdFiles}
            accept=".xls,.xlsx,.csv"
            mode="compact"
            isMultiple
          />
        </Stack>
      </Card>
</>)}
      {busy && <ProgressBar done={prog.done} total={prog.total} msg={prog.msg} />}
      {error && <Banner status="error" title="파일 읽기 실패" description={error} />}
      {parsed && <OrdersResults parsed={parsed} classMap={classMap} rules={rules} onRulesChange={onRulesChange} />}
    </Stack>
  )
}

/* ══════════════════ 기획전 상품 매출 섹션 ══════════════════ */

// 채널외(0) + APP) 분류 추적코드 전체
const PROMO_IDXS = ['0', ...CODES.filter((c) => c.c === 'APP' && c.i !== '0').map((c) => c.i)].join(',')

// 카테고리의 상품코드+상품명 조회 — 실제 goods_list 마크업 기반
// (행마다 data-mgcode="SAI..." 2회 출현, 상품명은 class="goodstitle" 스팬)
async function fetchCategoryProducts(cateIdx, onPage) {
  const codes = new Set()
  const names = {}
  for (let page = 1; page <= 5; page++) {
    if (onPage) onPage(page)
    const u = `${BASE}/Good/goods_list?pagesize=100&page=${page}&keyword=&search=mg_name&supply_idx=&price_from=0&price_to=0&date_from=&date_to=&sort=2&category=&good_status=&good_views=&good_packages=&good_overlap=&good_fees=&tags=&cateidxs=${encodeURIComponent(cateIdx)}&catenames=&topYN=N&memberOnly=&appOnly=&mg_gpg_idx=&mg_img_label=&mg_default_point_use=&mg_direct_discount_YN=&mg_stock_view=&mg_only_seller=&timesaleYN=&mg_naver_shopping=&mg_giftYN=`
    const html = await (await fetch(u, { credentials: 'include' })).text()
    const before = codes.size
    const segs = html.split(/data-mgcode="(SAI\d{6,})"/)
    for (let i = 1; i < segs.length - 1; i += 2) {
      const code = segs[i]
      codes.add(code)
      const nm = segs[i + 1].match(/goodstitle[^>]*>([\s\S]*?)</)
      const name = nm ? nm[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : ''
      if (name) names[code] = name
    }
    if (codes.size === before) break
    await sleep(250)
  }
  return { codes: [...codes], names }
}

function parseCodes(text) {
  return [...new Set(text.split(/[\s,;\n\t]+/).map((s) => s.trim()).filter((s) => /^[A-Za-z0-9_-]{4,}$/.test(s)))]
}

function PromoSection() {
  const [range, setRange] = useState(lastWeekRange())
  const [cmpOn, setCmpOn] = useState(false)
  const [cmpRange, setCmpRange] = useState(null)
  const [codesText, setCodesText] = useState('')
  const [cateIdx, setCateIdx] = useState('')
  const [cateBusy, setCateBusy] = useState(false)
  const [nameMap, setNameMap] = useState({})
  const [selPromo, setSelPromo] = useState(null)

  const [busy, setBusy] = useState(false)
  const [prog, setProg] = useState({ msg: '', done: 0, total: 0 })
  const [error, setError] = useState(null)
  const [res, setResRaw] = useState(() => restoredOf('promo'))
  const setRes = (v) => { setResRaw(v); if (v) registerSnap('promo', v) }
  const [sort, setSort] = useState([])
  const sortPlugin = useTableSortable({ sort, onSortChange: setSort })

  function addCmp() {
    if (!cmpRange && range?.start && range?.end) {
      const n = dayCount(range.start, range.end)
      setCmpRange({ start: shiftDays(range.start, -n), end: shiftDays(range.end, -n) })
    }
    setCmpOn(true)
  }

  async function load() {
    const codes = parseCodes(codesText)
    if (!codes.length) { setError('상품코드를 하나 이상 입력해주세요. (예: SAI56159818)'); return }
    if (codes.length > 60) { setError('상품코드가 60개를 넘어요. 나눠서 조회해주세요.'); return }
    if (!range?.start || !range?.end) { setError('기획전 기간을 선택해주세요.'); return }
    if (cmpOn && (!cmpRange?.start || !cmpRange?.end)) { setError('비교 기간을 선택해주세요.'); return }

    const total = codes.length * (cmpOn ? 2 : 1)
    let done = 0
    const step = (msg) => setProg({ msg, done, total })
    const tick = () => { done++; setProg((p) => ({ ...p, done })) }

    setBusy(true); setError(null); setRes(null)
    try {
      const rows = []
      for (const code of codes) {
        step(`기간 A 조회 중… ${code}`)
        const A = await fetchSalesSummary(range.start, range.end, PROMO_IDXS, code)
        tick(); await sleep(250)
        let B = null
        if (cmpOn) {
          step(`기간 B 조회 중… ${code}`)
          B = await fetchSalesSummary(cmpRange.start, cmpRange.end, PROMO_IDXS, code)
          tick(); await sleep(250)
        }
        rows.push({ name: code, amt: A.amt, cnt: A.cnt, profit: A.profit,
                    amtB: B?.amt ?? null, cntB: B?.cnt ?? null, profitB: B?.profit ?? null,
                    channels: A.rows || [] })
      }
      rows.sort((a, b) => b.amt - a.amt)
      const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0)
      setRes({
        rows, cmp: cmpOn, names: { ...nameMap },
        totals: { amt: sum('amt'), cnt: sum('cnt'), profit: sum('profit'),
                  amtB: cmpOn ? sum('amtB') : null, cntB: cmpOn ? sum('cntB') : null, profitB: cmpOn ? sum('profitB') : null },
        labelA: `${range.start} ~ ${range.end}`,
        labelB: cmpOn ? `${cmpRange.start} ~ ${cmpRange.end}` : null,
      })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const t = res?.totals
  const sortedRows = res
    ? (sort.length
        ? [...res.rows].sort((a, b) => {
            const { sortKey, direction } = sort[0]
            const av = a[sortKey] ?? -1, bv = b[sortKey] ?? -1
            const d = av > bv ? 1 : av < bv ? -1 : 0
            return direction === 'ascending' ? d : -d
          })
        : res.rows)
    : []

  const deltaCell = (cur, prev) => {
    if (prev == null) return '–'
    if (!prev) return cur ? <Badge variant="neutral" label="B 없음" /> : '–'
    const d = (cur - prev) / prev
    return <Badge variant={d >= 0 ? 'success' : 'error'} label={`${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}%`} />
  }

  return (
    <Stack gap={4}>
      <Card padding={3}>
        <Stack gap={3}>
          <Stack direction="horizontal" gap={3} vAlign="end" wrap="wrap">
            <DateRangeInput label="기획전 기간 (A)" value={range} onChange={setRange} presets={PRESETS} />
            {cmpOn ? (
              <>
                <DateRangeInput label="비교 기간 (B)" value={cmpRange} onChange={setCmpRange} presets={PRESETS} />
                <Button label="비교 제거" variant="ghost" clickAction={() => setCmpOn(false)} />
              </>
            ) : (
              <Button label="+ 비교기간 추가" variant="secondary" clickAction={addCmp} />
            )}
          </Stack>
          <Stack direction="horizontal" gap={2} vAlign="end" wrap="wrap">
            <div style={{ width: 220 }}>
              <TextInput label="카테고리 ID" description="예: 279 (복날 기획전)"
                         value={cateIdx} onChange={setCateIdx} placeholder="cateidxs 번호" />
            </div>
            <Button label={cateBusy ? '불러오는 중…' : '카테고리에서 상품코드 불러오기'}
                    variant="secondary" isDisabled={cateBusy || !cateIdx.trim()}
                    clickAction={async () => {
                      setCateBusy(true); setError(null)
                      try {
                        const { codes, names } = await fetchCategoryProducts(cateIdx.trim(), () => {})
                        if (!codes.length) throw new Error('해당 카테고리에서 상품코드를 찾지 못했어요. 카테고리 ID를 확인해주세요.')
                        setCodesText(codes.join('\n'))
                        setNameMap((prev) => ({ ...prev, ...names }))
                      } catch (e) { setError(e.message || String(e)) }
                      finally { setCateBusy(false) }
                    }} />
          </Stack>
          <TextArea
            label={`기획전 상품코드 (${parseCodes(codesText).length}개 인식됨)`}
            description="카테고리에서 자동으로 불러오거나, 쉼표·줄바꿈으로 직접 붙여넣기 — 불러온 뒤 수정도 가능"
            value={codesText}
            onChange={setCodesText}
            rows={3}
          />
          <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
            <Badge variant="green" label={`채널: 채널외 + APP) 추적코드 ${PROMO_IDXS.split(',').length - 1}개`} />
            <Button label={busy ? '조회 중…' : '기획전 매출 불러오기'} variant="primary" isDisabled={busy} clickAction={load} />
          </Stack>
        </Stack>
      </Card>

      {busy && <ProgressBar done={prog.done} total={prog.total} msg={prog.msg} />}
      {error && <Banner status="error" title="조회 실패" description={error} />}

      {res && (
        <>
          <Text type="label" weight="semibold">
            {res.cmp ? `A: ${res.labelA}  ·  B: ${res.labelB}` : res.labelA} · 채널외+APP 기준
          </Text>

          <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={3}>
            <Kpi label="정상금액 합계" value={won(t.amt)}
                 badge={res.cmp ? <DeltaBadge cur={t.amt} prev={t.amtB} label="비교 기간 대비" /> : null} />
            <Kpi label="정상건수 합계" value={comma(t.cnt) + '건'}
                 badge={res.cmp ? <DeltaBadge cur={t.cnt} prev={t.cntB} label="비교 기간 대비" /> : null} />
            <Kpi label="판매이익 합계" value={won(t.profit)}
                 badge={res.cmp ? <DeltaBadge cur={t.profit} prev={t.profitB} label="비교 기간 대비" /> : null} />
            <Kpi label="조회 상품" value={comma(res.rows.length) + '개'} sub="0원 상품 포함" />
          </Grid>

          <SnapCard>
            <Stack gap={2}>
              <Text type="label" weight="semibold">상품별 상세</Text>
              <Table
                data={sortedRows}
                idKey="name"
                density="compact"
                dividers="rows"
                plugins={{ sort: sortPlugin }}
                columns={[
                  { key: 'name', header: '상품코드', renderCell: (r) => (
                      <Text type="supporting" color="secondary">{r.name}</Text>
                    ) },
                  { key: 'pname', header: '상품명', renderCell: (r) => (
                      <span onClick={() => setSelPromo(r)}
                            style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                        {nameMap[r.name] || res.names?.[r.name] || r.name}
                      </span>
                    ) },
                  { key: 'amt', header: res.cmp ? 'A 매출' : '정상금액', sortable: true, renderCell: (r) => won(r.amt) },
                  ...(res.cmp ? [
                    { key: 'amtB', header: 'B 매출', sortable: true, renderCell: (r) => won(r.amtB) },
                    { key: 'dAmt', header: '매출 변동', renderCell: (r) => deltaCell(r.amt, r.amtB) },
                  ] : []),
                  { key: 'cnt', header: res.cmp ? 'A 건수' : '정상건수', sortable: true, renderCell: (r) => comma(r.cnt) },
                  ...(res.cmp ? [
                    { key: 'cntB', header: 'B 건수', sortable: true, renderCell: (r) => comma(r.cntB) },
                    { key: 'dCnt', header: '건수 변동', renderCell: (r) => deltaCell(r.cnt, r.cntB) },
                  ] : []),
                  { key: 'profit', header: res.cmp ? 'A 이익' : '판매이익', sortable: true, renderCell: (r) => won(r.profit) },
                  ...(res.cmp ? [
                    { key: 'profitB', header: 'B 이익', sortable: true, renderCell: (r) => won(r.profitB) },
                    { key: 'dProfit', header: '이익 변동', renderCell: (r) => deltaCell(r.profit, r.profitB) },
                  ] : []),
                ]}
              />
              <Text type="supporting" color="secondary">
                상품명 클릭 = 채널 비중 · 상품명은 카테고리 불러오기에서 자동 매칭 (직접 붙여넣은 코드는 코드로 표시)
              </Text>
            </Stack>
          </SnapCard>
        </>
      )}
      {selPromo && <PromoChannelDialog row={selPromo} title={nameMap[selPromo.name] || res?.names?.[selPromo.name] || selPromo.name}
                                       onClose={() => setSelPromo(null)} />}
    </Stack>
  )
}

function PromoChannelDialog({ row, title, onClose }) {
  if (!row) return null
  const chs = (row.channels || []).filter((c) => c.amt > 0)
  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) onClose() }} width={780} maxHeight="85vh">
      <Layout
        header={<DialogHeader title={title}
                              subtitle={`기간 A · 정상금액 ${won(row.amt)} · ${comma(row.cnt)}건 · 판매이익 ${won(row.profit)}`}
                              onOpenChange={(open) => { if (!open) onClose() }} />}
        content={
          <LayoutContent>
            <Stack gap={3}>
              {chs.length ? (
                <>
                  <Stack gap={1}>
                    <Text type="label" weight="semibold">채널(추적코드) 비중 — 채널외+APP 기준</Text>
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie data={chs.slice(0, 8)} dataKey="amt" nameKey="name" innerRadius={52} outerRadius={86}
                             paddingAngle={1.5} strokeWidth={0}>
                          {chs.slice(0, 8).map((c, i) => <Cell key={c.name} fill={ROUTE_COLORS[i % ROUTE_COLORS.length]} />)}
                        </Pie>
                        <RTooltip formatter={(v, n) => [`${won(v)} (${row.amt ? (v / row.amt * 100).toFixed(1) : 0}%)`, n]} />
                        <Legend iconType="circle" iconSize={9}
                                formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Stack>
                  <Table
                    data={chs}
                    idKey="name"
                    density="compact"
                    dividers="rows"
                    columns={[
                      { key: 'name', header: '채널 / 추적코드' },
                      { key: 'amt', header: '정상금액', renderCell: (r) => `${won(r.amt)} (${row.amt ? (r.amt / row.amt * 100).toFixed(1) : 0}%)` },
                      { key: 'cnt', header: '정상건수', renderCell: (r) => comma(r.cnt) },
                      { key: 'profit', header: '판매이익', renderCell: (r) => won(r.profit) },
                    ]}
                  />
                </>
              ) : (
                <Text color="secondary">기간 A에 이 상품의 채널별 매출 데이터가 없어요.</Text>
              )}
            </Stack>
          </LayoutContent>
        }
      />
    </Dialog>
  )
}

const COUPONS = [{"no":142,"name":"[웰컴] 1만원 할인쿠폰","active":true},{"no":141,"name":"[첫구매특가] 삼계탕 990원 쿠폰","active":true},{"no":140,"name":"[첫구매 감사] 3,000원 할인쿠폰","active":true},{"no":139,"name":"[봄나들이] 쑥버무리 할인쿠폰","active":true},{"no":138,"name":"[봄나들이] 쑥설기 할인쿠폰","active":true},{"no":137,"name":"[봄나들이] 동인동식 소갈비찜 할인쿠폰","active":true},{"no":136,"name":"[봄나들이] 포천식 양념왕구이 할인쿠폰","active":true},{"no":135,"name":"[봄나들이] 밭 미나리 할인쿠폰","active":true},{"no":134,"name":"[봄나들이] 머위김치 할인쿠폰","active":true},{"no":133,"name":"[봄나들이] 쑥개떡 할인쿠폰","active":true},{"no":132,"name":"[봄나들이] 성주참외 할인쿠폰","active":true},{"no":131,"name":"[봄나들이] 더덕무침 할인쿠폰","active":true},{"no":130,"name":"[봄나들이] 동치미 할인쿠폰","active":true},{"no":129,"name":"[봄나들이] 쑥떡인절미 할인쿠폰","active":true},{"no":128,"name":"[봄나들이] 봄나물 8종 할인쿠폰","active":true},{"no":127,"name":"[봄나들이] 햇쑥 할인쿠폰","active":true},{"no":126,"name":"[봄나들이] 참두릅 할인쿠폰","active":true},{"no":125,"name":"[봄나들이] 꽁보리 얼갈이 물김치 할인쿠폰","active":true},{"no":124,"name":"[봄나들이] 알배기겉절이 할인쿠폰","active":true},{"no":123,"name":"[봄나들이] 대저토마토 할인쿠폰","active":true},{"no":122,"name":"[봄나들이] 달래장 할인쿠폰","active":true},{"no":121,"name":"플친추가 3천원 할인","active":true},{"no":120,"name":"[설맞이룰렛] 3% 할인쿠폰","active":true},{"no":119,"name":"[설맞이룰렛] 5% 할인쿠폰","active":true},{"no":118,"name":"[설맞이룰렛] 25% 할인쿠폰","active":true},{"no":117,"name":"[설맞이룰렛] 50% 할인쿠폰","active":true},{"no":116,"name":"[연말감사제] 축산물 7,000원 할인 쿠폰","active":true},{"no":115,"name":"[연말감사제] 축산물 3,000원 할인 쿠폰","active":true},{"no":114,"name":"[연말감사제] 한상차림 3,000원 할인 쿠폰","active":true},{"no":113,"name":"[연말감사제] 한상차림 7,000원 할인 쿠폰","active":true},{"no":112,"name":"[연말감사제] 수산물 7,000원 할인 쿠폰","active":true},{"no":111,"name":"[연말감사제] 수산물 3,000원 할인 쿠폰","active":true},{"no":110,"name":"[연말감사제] 7,000원 할인쿠폰","active":true},{"no":109,"name":"[연말감사제] 3,000원 할인쿠폰","active":true},{"no":108,"name":"[김장 기획전] 7,000원 할인","active":true},{"no":107,"name":"[김장 기획전] 3,000원 할인","active":true},{"no":106,"name":"[추석 기획전] 3,000원 할인 쿠폰","active":true},{"no":105,"name":"[추석 기획전] 7,000원 할인 쿠폰","active":true},{"no":104,"name":"[추석 기획전] 10,000원 할인 쿠폰","active":true},{"no":103,"name":"우리농부로부터 플친추가 3천원 할인","active":true},{"no":102,"name":"[늦여름 별미전] 늦여름 상품 3천원 할인(5만원 이상 구매 시)","active":true},{"no":101,"name":"[늦여름 별미전] 늦여름 상품 1만원 할인(10만원 이상 구매 시)","active":true},{"no":100,"name":"[건강한 밥상] 3,000원 할인 (5만원 이상 구매 시)","active":true},{"no":99,"name":"[신규회원 전용] 7% 할인쿠폰","active":true},{"no":98,"name":"[신규회원 전용] 5% 할인쿠폰","active":true},{"no":97,"name":"[신규회원 전용] 3% 할인쿠폰","active":true},{"no":96,"name":"[앱다운] 5천원 할인쿠폰","active":true},{"no":95,"name":"[앱다운] 3천원 할인쿠폰","active":true},{"no":94,"name":"[앱다운] 2천원 할인쿠폰","active":true},{"no":93,"name":"[웰컴] 5천원 할인쿠폰","active":true},{"no":92,"name":"[웰컴] 3천원 할인쿠폰","active":true},{"no":91,"name":"[웰컴] 2천원 할인쿠폰","active":true},{"no":90,"name":"[추석] 5,000원 할인 (10만원 이상 구매 시)","active":true},{"no":89,"name":"[추석] 3,000원 할인 (7만원 이상 구매 시)","active":true},{"no":88,"name":"[추석] 2,000원 할인 (5만원 이상 구매 시)","active":true},{"no":87,"name":"[추석] 1,000원 할인 (3만원 이상 구매 시)","active":true},{"no":86,"name":"[광복절] 5,000원 할인 (10만원 이상 구매 시)","active":true},{"no":85,"name":"[광복절] 3,000원 할인 (7만원 이상 구매 시)","active":true},{"no":84,"name":"[광복절] 2,000원 할인 (5만원 이상 구매 시)","active":true},{"no":83,"name":"[광복절] 1,000원 할인 (3만원 이상 구매 시)","active":true},{"no":82,"name":"[모든상품 적용가능] 4,000원 할인 (10만원 이상 구매 시)","active":true},{"no":81,"name":"[모든상품 적용가능] 3,000원 할인 (8만원 이상 구매 시)","active":true},{"no":80,"name":"[모든상품 적용가능] 2,000원 할인 (6만원 이상 구매 시)","active":true},{"no":79,"name":"[모든상품 적용가능] 1,000원 할인 (3만원 이상 구매 시)","active":true},{"no":78,"name":"[6월한정] 1,000원 할인 (3만원 이상 구매 시)","active":true},{"no":77,"name":"[생일쿠폰] 전 상품 5% 할인!","active":true},{"no":76,"name":"[6월한정] 6,000원 할인 (10만원 이상 구매 시)","active":true},{"no":75,"name":"[6월한정] 3,000원 할인 (5만원 이상 구매 시)","active":true},{"no":74,"name":"[5월 깜짝쿠폰] 4,000원 할인 (10만원 이상 구매 시)","active":true},{"no":73,"name":"[5월 깜짝쿠폰] 2,000원 할인 (6만원 이상 구매 시)","active":true},{"no":72,"name":"[5월 깜짝쿠폰] 1,000원 할인 (3만원 이상 구매 시)","active":true},{"no":71,"name":"웰컴 2,000원 할인 쿠폰","active":true},{"no":70,"name":"웰컴 3,000원 할인 쿠폰","active":true},{"no":69,"name":"웰컴 5,000원 할인 쿠폰","active":true},{"no":68,"name":"웰컴 10,000원 할인 쿠폰","active":true},{"no":67,"name":"[5월 가정의달] 1,000원 할인쿠폰","active":true},{"no":66,"name":"[5월 가정의달] 2,000원 할인쿠폰","active":true},{"no":65,"name":"[5월 가정의달] 3,000원 할인쿠폰","active":true},{"no":64,"name":"[5월 가정의달] 4,000원 할인쿠폰","active":true},{"no":63,"name":"[5월 가정의달] 10,000원 할인쿠폰","active":true},{"no":62,"name":"[가정의달] 1,000원 할인쿠폰","active":true},{"no":61,"name":"[가정의달] 2,000원 할인쿠폰","active":true},{"no":60,"name":"[가정의달] 3,000원 할인쿠폰","active":true},{"no":59,"name":"[가정의달] 4,000원 할인쿠폰","active":true},{"no":58,"name":"[가정의달] 10,000원 할인쿠폰","active":true},{"no":57,"name":"웰컴 5,000원 할인 쿠폰 (앱 전용)","active":true},{"no":56,"name":"웰컴 3,000원 할인 쿠폰 (앱 전용)","active":true},{"no":55,"name":"웰컴 2,000원 할인 쿠폰 (앱 전용)","active":true},{"no":54,"name":"웰컴 가입쿠폰 [3,000원]","active":true},{"no":53,"name":"웰컴 가입쿠폰 [1,000원]","active":true},{"no":52,"name":"[4월 쿠폰팩] 10,000원 할인쿠폰","active":true},{"no":51,"name":"[4월 쿠폰팩] 5,000원 할인쿠폰","active":true},{"no":50,"name":"[4월 쿠폰팩] 3,000원 할인쿠폰","active":true},{"no":49,"name":"[4월 쿠폰팩] 2,000원 할인쿠폰","active":true},{"no":48,"name":"플친추가 3천원 할인","active":true},{"no":47,"name":"[3월 쿠폰팩] 2,000원 할인쿠폰","active":true},{"no":46,"name":"[3월 쿠폰팩] 3,000원 할인쿠폰","active":true},{"no":45,"name":"[3월 쿠폰팩] 5,000원 할인쿠폰","active":true},{"no":44,"name":"[3월 쿠폰팩] 10,000원 할인쿠폰","active":true},{"no":43,"name":"감자탕 1,900원 쿠폰","active":true},{"no":42,"name":"어포튀각 100원 쿠폰","active":true},{"no":41,"name":"춘천닭갈비 100원 쿠폰","active":true},{"no":40,"name":"무안양파 100원 쿠폰","active":true},{"no":39,"name":"[2월 쿠폰팩] 10,000원 할인쿠폰","active":true},{"no":38,"name":"[2월 쿠폰팩] 5,000원 할인쿠폰","active":true},{"no":37,"name":"[2월 쿠폰팩] 3,000원 할인쿠폰","active":true},{"no":36,"name":"[2월 쿠폰팩] 2,000원 할인쿠폰","active":true},{"no":35,"name":"[룰렛당첨] 7만원 이상 구매시 15,000원 할인쿠폰","active":true},{"no":34,"name":"[룰렛당첨] 5만원 이상 구매시 10,000원 할인쿠폰","active":true},{"no":33,"name":"[룰렛당첨] 3만원 이상 구매시 3,000원 할인쿠폰","active":true},{"no":32,"name":"[룰렛당첨] 1만원 이상 구매시 1,000원 할인쿠폰","active":true},{"no":31,"name":"조생감귤 100원 쿠폰","active":true},{"no":30,"name":"웰컴쿠폰![12,000원]","active":true},{"no":29,"name":"웰컴쿠폰![9,000원]","active":true},{"no":28,"name":"웰컴쿠폰![5,000원]","active":true},{"no":27,"name":"웰컴쿠폰![3,000원]","active":true},{"no":26,"name":"웰컴쿠폰![1,000원]","active":true},{"no":25,"name":"1만원 연말쿠폰팩 (10만원 이상 구매시)","active":true},{"no":24,"name":"5천원 연말쿠폰팩 (5만원 이상 구매시)","active":true},{"no":23,"name":"3천원 연말쿠폰팩 (3만원 이상 구매시)","active":true},{"no":22,"name":"반건조양미리 2,900원 쿠폰","active":true},{"no":21,"name":"동치미 2,900원 쿠폰","active":true},{"no":20,"name":"홍가리비 100원 쿠폰","active":true},{"no":19,"name":"타이벡감귤 2,900원 쿠폰","active":true},{"no":18,"name":"생굴 1,900원 쿠폰","active":true},{"no":17,"name":"미니족발 100원 쿠폰","active":true},{"no":16,"name":"손질꽃게 100원 쿠폰","active":true},{"no":15,"name":"수제왕꿀호떡 100원 쿠폰","active":true},{"no":14,"name":"[인스타 고객전용] 할인쿠폰","active":true},{"no":13,"name":"[룰렛당첨] 7만원 이상 구매시 15,000원 할인쿠폰","active":true},{"no":12,"name":"[룰렛당첨] 5만원 이상 구매시 10,000원 할인쿠폰","active":true},{"no":11,"name":"[룰렛당첨] 3만원 이상 구매시 3,000원 할인쿠폰","active":true},{"no":10,"name":"[룰렛당첨] 1만원 이상 구매시 1,000원 할인쿠폰","active":true},{"no":9,"name":"[출석체크] 5만원 이상 구매시10,000원 할인쿠폰","active":true},{"no":8,"name":"[출석체크] 3만원이상 구매시 2,000원 할인쿠폰","active":true},{"no":7,"name":"[출석체크] 7일차 1,000P","active":true},{"no":6,"name":"[열매] 7,000원 할인쿠폰","active":true},{"no":5,"name":"[잎새] 5,000원 할인쿠폰","active":true},{"no":4,"name":"[새싹] 1,000원 할인쿠폰","active":true},{"no":3,"name":"웰컴쿠폰![1000원]","active":true},{"no":2,"name":"웰컴쿠폰![2000원]","active":true},{"no":1,"name":"[나무] 10,000원 할인쿠폰","active":true}]

// 쿠폰 발급/사용 건수 조회 — mch_status: 1=지급, 2=사용 / 처리일 기준 / "전체 N건" 파싱
async function fetchCouponCount(couponName, from, to, status) {
  const u = `${BASE}/User/coupon_list?userType=&mch_status=${status}&mch_pattern=&mo_order_num=&couponName=${encodeURIComponent(couponName)}&sc_id=&sc_name=&sc_htel=&sc_email=&date_from=${from}&date_to=${to}&sort=mch_regdate&pagesize=1&page=1`
  const html = await (await fetch(u, { credentials: 'include' })).text()
  const m = html.match(/전체\s*<span[^>]*>\s*([\d,]+)/)
  return m ? numOf(m[1]) : 0
}

/* ══════════════════ 쿠폰 사용량 섹션 (틀 — 조회 API 연결 대기) ══════════════════ */

function CouponSection() {
  const [range, setRange] = useState(lastWeekRange())
  const [cmpOn, setCmpOn] = useState(false)
  const [cmpRange, setCmpRange] = useState(null)
  const [sel, setSel] = useState([])

  const [busy, setBusy] = useState(false)
  const [prog, setProg] = useState({ msg: '', done: 0, total: 0 })
  const [error, setError] = useState(null)
  const [res, setResRaw] = useState(() => restoredOf('coupon'))
  const setRes = (v) => { setResRaw(v); if (v) registerSnap('coupon', v) }
  const [sort, setSort] = useState([])
  const sortPlugin = useTableSortable({ sort, onSortChange: setSort })
  const [chartMetric, setChartMetric] = useState('used')

  function addCmp() {
    if (!cmpRange && range?.start && range?.end) {
      const n = dayCount(range.start, range.end)
      setCmpRange({ start: shiftDays(range.start, -n), end: shiftDays(range.end, -n) })
    }
    setCmpOn(true)
  }

  async function load() {
    if (!sel.length) { setError('쿠폰을 하나 이상 선택해주세요.'); return }
    if (sel.length > 40) { setError('쿠폰이 40개를 넘어요. 나눠서 조회해주세요.'); return }
    if (!range?.start || !range?.end) { setError('조회 기간을 선택해주세요.'); return }
    if (cmpOn && (!cmpRange?.start || !cmpRange?.end)) { setError('비교 기간을 선택해주세요.'); return }

    const coupons = sel.map((v) => COUPONS.find((c) => String(c.no) === v)).filter(Boolean)
    const total = coupons.length * 2 * (cmpOn ? 2 : 1)
    let done = 0
    const step = (msg) => setProg({ msg, done, total })
    const tick = () => { done++; setProg((p) => ({ ...p, done })) }

    setBusy(true); setError(null); setRes(null)
    try {
      const rows = []
      for (const c of coupons) {
        step(`발급 조회 중… ${c.name}`)
        const issued = await fetchCouponCount(c.name, range.start, range.end, '1')
        tick(); await sleep(250)
        step(`사용 조회 중… ${c.name}`)
        const used = await fetchCouponCount(c.name, range.start, range.end, '2')
        tick(); await sleep(250)
        let issuedB = null, usedB = null
        if (cmpOn) {
          step(`비교기간 발급 조회 중… ${c.name}`)
          issuedB = await fetchCouponCount(c.name, cmpRange.start, cmpRange.end, '1')
          tick(); await sleep(250)
          step(`비교기간 사용 조회 중… ${c.name}`)
          usedB = await fetchCouponCount(c.name, cmpRange.start, cmpRange.end, '2')
          tick(); await sleep(250)
        }
        rows.push({ name: c.name, no: c.no, issued, used, issuedB, usedB })
      }
      rows.sort((a, b) => b.used - a.used)
      const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0)
      setRes({
        rows, cmp: cmpOn,
        totals: { issued: sum('issued'), used: sum('used'),
                  issuedB: cmpOn ? sum('issuedB') : null, usedB: cmpOn ? sum('usedB') : null },
        labelA: `${range.start} ~ ${range.end}`,
        labelB: cmpOn ? `${cmpRange.start} ~ ${cmpRange.end}` : null,
      })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const t = res?.totals
  const rate = (used, issued) => issued ? (used / issued * 100).toFixed(1) + '%' : '–'
  const deltaCell = (cur, prev) => {
    if (prev == null) return '–'
    if (!prev) return cur ? <Badge variant="neutral" label="B 없음" /> : '–'
    const d = (cur - prev) / prev
    return <Badge variant={d >= 0 ? 'success' : 'error'} label={`${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}%`} />
  }
  const sortedRows = res
    ? (sort.length
        ? [...res.rows].sort((a, b) => {
            const { sortKey, direction } = sort[0]
            const av = a[sortKey] ?? -1, bv = b[sortKey] ?? -1
            const d = av > bv ? 1 : av < bv ? -1 : 0
            return direction === 'ascending' ? d : -d
          })
        : res.rows)
    : []

  return (
    <Stack gap={4}>
      <Card padding={3}>
        <Stack gap={3}>
          <Stack direction="horizontal" gap={3} vAlign="end" wrap="wrap">
            <DateRangeInput label="조회 기간 (A)" value={range} onChange={setRange} presets={PRESETS} />
            {cmpOn ? (
              <>
                <DateRangeInput label="비교 기간 (B)" value={cmpRange} onChange={setCmpRange} presets={PRESETS} />
                <Button label="비교 제거" variant="ghost" clickAction={() => setCmpOn(false)} />
              </>
            ) : (
              <Button label="+ 비교기간 추가" variant="secondary" clickAction={addCmp} />
            )}
            <div style={{ minWidth: 340 }}>
              <MultiSelector
                label={`쿠폰 선택 (${sel.length}개)`}
                options={COUPONS.map((c) => ({ value: String(c.no), label: `[${c.no}] ${c.name}` }))}
                value={sel}
                onChange={setSel}
                hasSelectAll
                hasSearch
                searchPlaceholder="쿠폰명 또는 번호로 검색…"
              />
            </div>
          </Stack>
          <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
            <Button label={busy ? '조회 중…' : '쿠폰 데이터 불러오기'} variant="primary" isDisabled={busy} clickAction={load} />
            <Text type="supporting" color="secondary">쿠폰당 요청 2회 (발급/사용) · 처리일 기준</Text>
          </Stack>
        </Stack>
      </Card>

      {busy && <ProgressBar done={prog.done} total={prog.total} msg={prog.msg} />}
      {error && <Banner status="error" title="조회 실패" description={error} />}

      {res && (
        <>
          <Text type="label" weight="semibold">
            {res.cmp ? `A: ${res.labelA}  ·  B: ${res.labelB}` : res.labelA}
          </Text>

          <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={3}>
            <Kpi label="발급량 합계" value={comma(t.issued) + '건'}
                 badge={res.cmp ? <DeltaBadge cur={t.issued} prev={t.issuedB} label="비교 기간 대비" /> : null} />
            <Kpi label="사용량 합계" value={comma(t.used) + '건'}
                 badge={res.cmp ? <DeltaBadge cur={t.used} prev={t.usedB} label="비교 기간 대비" /> : null} />
            <Kpi label="사용률 (A)" value={rate(t.used, t.issued)}
                 badge={res.cmp && t.issued && t.issuedB ? (() => {
                   const d = (t.used / t.issued - t.usedB / t.issuedB) * 100
                   return <Badge variant={d >= 0 ? 'success' : 'error'} label={`비교 기간 대비 ${d >= 0 ? '+' : ''}${d.toFixed(1)}%p`} />
                 })() : null}
                 sub={res.cmp ? null : '기간 내 사용 ÷ 기간 내 발급'} />
            <Kpi label="조회 쿠폰" value={comma(res.rows.length) + '개'} />
          </Grid>

          <SnapCard>
            <Stack gap={2}>
              <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
                <Text type="label" weight="semibold">쿠폰별 {chartMetric === 'used' ? '사용량' : '발급량'}</Text>
                <div style={{ flex: 1 }} />
                <TabList value={chartMetric} onChange={setChartMetric} size="sm">
                  <Tab value="used" label="사용량" />
                  <Tab value="issued" label="발급량" />
                </TabList>
              </Stack>
              <ResponsiveContainer width="100%" height={Math.max(160, res.rows.length * (res.cmp ? 58 : 40))}>
                <BarChart data={res.rows} layout="vertical" margin={{ top: 4, right: 70, left: 8, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={190}
                         tick={{ fontSize: 12 }} tickLine={false} axisLine={false}
                         tickFormatter={(v) => v.length > 16 ? v.slice(0, 16) + '…' : v} />
                  <RTooltip formatter={(v, n) => [comma(v) + '건', n === (chartMetric === 'used' ? 'used' : 'issued') ? '기간 A' : '기간 B']}
                            cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
                  {res.cmp && <Legend iconType="circle" iconSize={9}
                          formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v === chartMetric ? '기간 A' : '기간 B'}</span>} />}
                  <Bar dataKey={chartMetric} fill="var(--ch-app, #1c4f3a)" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    <LabelList dataKey={chartMetric} position="right" formatter={comma}
                               style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                  </Bar>
                  {res.cmp && (
                    <Bar dataKey={chartMetric + 'B'} fill="var(--ch-kakao, #e6b422)" radius={[0, 4, 4, 0]} maxBarSize={20}>
                      <LabelList dataKey={chartMetric + 'B'} position="right" formatter={comma}
                                 style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </Stack>
          </SnapCard>

          <SnapCard>
            <Stack gap={2}>
              <Text type="label" weight="semibold">쿠폰별 상세</Text>
              <Table
                data={sortedRows}
                idKey="no"
                density="compact"
                dividers="rows"
                textOverflow="truncate"
                plugins={{ sort: sortPlugin }}
                columns={[
                  { key: 'name', header: '쿠폰명' },
                  { key: 'issued', header: res.cmp ? 'A 발급' : '발급량', sortable: true, renderCell: (r) => comma(r.issued) },
                  ...(res.cmp ? [
                    { key: 'issuedB', header: 'B 발급', sortable: true, renderCell: (r) => comma(r.issuedB) },
                    { key: 'dIssued', header: '발급 변동', renderCell: (r) => deltaCell(r.issued, r.issuedB) },
                  ] : []),
                  { key: 'used', header: res.cmp ? 'A 사용' : '사용량', sortable: true, renderCell: (r) => comma(r.used) },
                  ...(res.cmp ? [
                    { key: 'usedB', header: 'B 사용', sortable: true, renderCell: (r) => comma(r.usedB) },
                    { key: 'dUsed', header: '사용 변동', renderCell: (r) => deltaCell(r.used, r.usedB) },
                  ] : []),
                  { key: 'rate', header: res.cmp ? '사용률 A' : '사용률', renderCell: (r) => rate(r.used, r.issued) },
                  ...(res.cmp ? [
                    { key: 'rateB', header: '사용률 B', renderCell: (r) => rate(r.usedB, r.issuedB) },
                    { key: 'dRate', header: '사용률 변동', renderCell: (r) => {
                        if (!r.issued || !r.issuedB) return '–'
                        const d = (r.used / r.issued - r.usedB / r.issuedB) * 100
                        return <Badge variant={d >= 0 ? 'success' : 'error'} label={`${d >= 0 ? '+' : ''}${d.toFixed(1)}%p`} />
                      } },
                  ] : []),
                ]}
              />
              <Text type="supporting" color="secondary">
                사용률 주의: 기간 내 발급분과 기간 내 사용분은 코호트가 달라요 — 이번 기간에 사용된 쿠폰이 이전 기간 발급분일 수 있어요. 웰컴쿠폰처럼 상시 발급 쿠폰은 참고 지표로만.
              </Text>
            </Stack>
          </SnapCard>
        </>
      )}
    </Stack>
  )
}

/* ══════════════════ 회원 유형 분석 섹션 ══════════════════ */

// 12개 분할 엑셀을 순차 처리 — 필요한 컬럼만 보관 (회원당 12개 필드)
export function newMemberStore() {
  return { n: 0, seen: new Set(), excluded: 0, dup: 0, maxDate: '',
           ids: [], names: [], phones: [], grades: [],
           joined: [], lastLogin: [], firstBuy: [], lastBuy: [],
           qty: [], amt: [], sms: [], app: [],
           birth: [], birthHad: 0, birthBad: 0 }
}

// projectMembers는 memberProject.js 공용 모듈에 (워커와 공유)
// 2단계(메인 스레드): 파일 간 중복 제거하며 스토어에 병합
export function mergeProjected(store, proj) {
  const m = proj.uid.length
  for (let i = 0; i < m; i++) {
    if (proj.status[i] !== '사용중') { store.excluded++; continue }
    const uid = proj.uid[i]
    if (!uid) { store.excluded++; continue }
    if (store.seen.has(uid)) { store.dup++; continue }
    store.seen.add(uid)
    store.n++
    store.ids.push(proj.id[i])
    store.names.push(proj.name[i])
    store.phones.push(proj.phone[i])
    store.grades.push(proj.grade[i])
    store.joined.push(proj.joined[i])
    store.lastLogin.push(proj.lastLogin[i])
    store.firstBuy.push(proj.firstBuy[i])
    store.lastBuy.push(proj.lastBuy[i])
    if (proj.joined[i] && proj.joined[i] > store.maxDate) store.maxDate = proj.joined[i]
    if (proj.lastLogin[i] && proj.lastLogin[i] > store.maxDate) store.maxDate = proj.lastLogin[i]
    store.qty.push(proj.qty[i])
    store.amt.push(proj.amt[i])
    store.sms.push(proj.sms[i])
    store.app.push(proj.app[i])
    const bv = proj.birth ? proj.birth[i] : 0
    if (bv > 0) { store.birth.push(bv); store.birthHad++ }
    else if (bv === -1) { store.birth.push(0); store.birthHad++; store.birthBad++ }
    else store.birth.push(0)
  }
  return store
}

// 테스트/폴백용: 한 번에 처리
export function addMembersToStore(store, headers, data) {
  return mergeProjected(store, projectMembers(headers, data))
}

// 분류 기준 상수 (카드에도 그대로 표기)
const REGULAR_AMT = 500000 // 단골 = 누적 구매금액 50만원 이상 (잎새 기준)

export const LIFECYCLE_DEFS = [
  { key: 0, label: '미구매', desc: '구매 이력 없음' },
  { key: 1, label: '첫구매', desc: '구매일 1일 (최초 = 최종 구매일)' },
  { key: 2, label: '재구매', desc: '구매일 2일 이상 · 누적 50만원 미만' },
  { key: 3, label: '단골', desc: '누적 구매금액 50만원 이상' },
]
export const ACTIVITY_DEFS = [
  { key: 0, label: '활성', desc: '최근 로그인 30일 이내' },
  { key: 1, label: '관망', desc: '최근 로그인 31~90일' },
  { key: 2, label: '휴면', desc: '최근 로그인 91~180일' },
  { key: 3, label: '장기휴면', desc: '최근 로그인 180일 초과 (기록 없으면 가입일 기준)' },
]
export const SEGMENT_DEFS = [
  { key: 0, label: '웰컴 대기', desc: '가입 30일 이내 · 미구매', action: '웰컴쿠폰 시퀀스' },
  { key: 1, label: '잠자는 미구매', desc: '가입 30일 초과 · 미구매', action: '첫구매 특가 or 제외' },
  { key: 2, label: '첫구매 골든타임', desc: '첫구매 후 30일 이내', action: '재구매 유도 캠페인' },
  { key: 3, label: '성장 중', desc: '재구매 · 최종구매 90일 이내', action: '등급 승급 넛지' },
  { key: 4, label: '단골', desc: '누적 50만원+ · 최종구매 90일 이내', action: '신상품·기획전 우선 안내' },
  { key: 5, label: '이탈 위험 단골', desc: '누적 50만원+ · 최종구매 90일 초과', action: '최우선 방어 (전용 쿠폰)' },
  { key: 6, label: '휴면 구매자', desc: '구매 이력 있음 · 최종구매 90일 초과 · 비단골', action: '저비용 채널만' },
]

/* ══════════════════ 연령대 분석 (v48) ══════════════════ */

export const AGE_BUCKETS = ['10대 이하', '20대', '30대', '40대', '50대', '60대 이상']
export const AGE_COLORS = ['#b7c9a8', '#8fb07e', '#5f9060', '#3a704c', '#1c4f3a', '#e6b422']

export function ageAt(birthInt, refStr) {
  const by = Math.floor(birthInt / 10000)
  const bm = Math.floor(birthInt / 100) % 100
  const bd = birthInt % 100
  const ry = +refStr.slice(0, 4), rm = +refStr.slice(5, 7), rd = +refStr.slice(8, 10)
  return ry - by - ((rm * 100 + rd) < (bm * 100 + bd) ? 1 : 0)
}
const ageBucketIdx = (age) => age < 20 ? 0 : age < 30 ? 1 : age < 40 ? 2 : age < 50 ? 3 : age < 60 ? 4 : 5

export function computeAgeAnalysis(store, snapStr, joinRange = null) {
  const dist = [0, 0, 0, 0, 0, 0]
  let withBirth = 0, included = 0
  const trendMap = new Map()
  const assign = new Uint8Array(store.n).fill(255)
  for (let i = 0; i < store.n; i++) {
    const j = store.joined[i]
    if (joinRange) {
      if (!j || j < joinRange.start || j > joinRange.end) continue
    }
    included++
    const b = store.birth[i]
    if (!b) continue
    withBirth++
    const bi = ageBucketIdx(ageAt(b, snapStr))
    assign[i] = bi
    dist[bi]++
    if (j) {
      const ym = j.slice(0, 7)
      let arr = trendMap.get(ym)
      if (!arr) { arr = [0, 0, 0, 0, 0, 0]; trendMap.set(ym, arr) }
      arr[ageBucketIdx(ageAt(b, j))]++
    }
  }
  let months = [...trendMap.keys()].sort()
  let trendTruncated = false
  if (months.length > 36) { months = months.slice(-36); trendTruncated = true }
  const trend = months.map((ym) => {
    const arr = trendMap.get(ym)
    const o = { ym }
    AGE_BUCKETS.forEach((bk, k) => { o[bk] = arr[k] })
    return o
  })
  return { dist, withBirth, included, invalid: store.birthBad, trend, trendTruncated, assign }
}

export function classifyMembers(store, todayStr, joinRange = null) {
  const today = new Date(todayStr + 'T00:00:00').getTime()
  const days = (d) => d ? Math.floor((today - new Date(d + 'T00:00:00').getTime()) / 86400000) : Infinity
  const n = store.n
  const lifecycle = new Uint8Array(n)
  const activity = new Uint8Array(n)
  const segment = new Uint8Array(n)
  let included = 0
  for (let i = 0; i < n; i++) {
    if (joinRange) {
      const j = store.joined[i]
      if (!j || j < joinRange.start || j > joinRange.end) {
        lifecycle[i] = 255; activity[i] = 255; segment[i] = 255
        continue
      }
    }
    included++
    const bought = !!(store.firstBuy[i] || store.lastBuy[i] || store.qty[i] > 0)
    const regular = store.amt[i] >= REGULAR_AMT
    const dJoin = days(store.joined[i])
    const dLast = days(store.lastBuy[i] || store.firstBuy[i])
    const dLogin = days(store.lastLogin[i] || store.joined[i])

    // 생애주기
    lifecycle[i] = !bought ? 0
      : regular ? 3
      : (store.firstBuy[i] && store.firstBuy[i] === store.lastBuy[i]) ? 1
      : 2

    // 활동성
    activity[i] = dLogin <= 30 ? 0 : dLogin <= 90 ? 1 : dLogin <= 180 ? 2 : 3

    // 세그먼트 (상호배타)
    segment[i] = !bought
      ? (dJoin <= 30 ? 0 : 1)
      : regular
        ? (dLast <= 90 ? 4 : 5)
        : (lifecycle[i] === 1 && dLast <= 30) ? 2
        : dLast <= 90 ? 3
        : 6
  }
  if (!joinRange) included = n
  const count = (arr, k) => { let c = 0; for (let i = 0; i < n; i++) if (arr[i] === k) c++; return c }
  return {
    lifecycle, activity, segment, included,
    counts: {
      lifecycle: LIFECYCLE_DEFS.map((d) => count(lifecycle, d.key)),
      activity: ACTIVITY_DEFS.map((d) => count(activity, d.key)),
      segment: SEGMENT_DEFS.map((d) => count(segment, d.key)),
    },
  }
}

// 카드 클릭 시 상세 (등급 분포 + 리스트 샘플 + CSV 전체)
export function memberCardDetail(store, arr, key, limit = 100) {
  const gradeCounts = {}
  const sample = []
  let total = 0, smsOk = 0, appOk = 0
  for (let i = 0; i < store.n; i++) {
    if (arr[i] !== key) continue
    total++
    const g = store.grades[i]
    gradeCounts[g] = (gradeCounts[g] || 0) + 1
    if (store.sms[i]) smsOk++
    if (store.app[i]) appOk++
    if (sample.length < limit) {
      sample.push({ _id: i, id: store.ids[i], name: store.names[i], phone: store.phones[i],
                    grade: g, joined: store.joined[i], lastBuy: store.lastBuy[i],
                    qty: store.qty[i], amt: store.amt[i] })
    }
  }
  return { total, gradeCounts, sample, smsOk, appOk }
}

export function memberCsv(store, arr, key) {
  const head = '아이디,이름,전화번호,등급,가입일,최종구매일,총구매수량,총구매금액,SMS수신동의,APP설치'
  const esc = (s) => { const t = String(s ?? ''); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t }
  const lines = [head]
  for (let i = 0; i < store.n; i++) {
    if (arr[i] !== key) continue
    lines.push([store.ids[i], store.names[i], store.phones[i], store.grades[i],
                store.joined[i], store.lastBuy[i], store.qty[i], store.amt[i],
                store.sms[i] ? '동의' : '미동의', store.app[i] ? 'Y' : 'N'].map(esc).join(','))
  }
  return '\uFEFF' + lines.join('\n')
}

function MemberTypeCard({ label, count, prev, total, desc, action, onClick }) {
  return (
    <SnapCard>
      <div onClick={onClick} style={{ cursor: 'pointer' }}>
        <Stack gap={1}>
          <Text type="label" color="secondary">{label}</Text>
          <Stack direction="horizontal" gap={1.5} vAlign="baseline">
            <Text type="display-3" weight="bold">{comma(count)}명</Text>
            <Text type="supporting" color="secondary">{total ? (count / total * 100).toFixed(1) : 0}%</Text>
          </Stack>
          {prev != null && (
            <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
              {prev ? (
                <Badge variant={count - prev >= 0 ? 'success' : 'error'}
                       label={`${count - prev >= 0 ? '+' : ''}${comma(count - prev)}명 (${((count - prev) / prev * 100).toFixed(1)}%)`} />
              ) : (
                <Badge variant="neutral" label={`비교 시점 0명 → +${comma(count)}명`} />
              )}
              <Text type="supporting" color="secondary">비교 {comma(prev)}명</Text>
            </Stack>
          )}
          <Text type="supporting" color="secondary">기준: {desc}</Text>
          {action && <Badge variant="neutral" label={`액션: ${action}`} />}
        </Stack>
      </div>
    </SnapCard>
  )
}

function MemberListDialog({ store, arr, item, storeB, arrB, snapB, todayStr, onClose }) {
  const det = useMemo(() => memberCardDetail(store, arr, item.key, 100), [store, arr, item])
  const detB = useMemo(() => (storeB && arrB) ? memberCardDetail(storeB, arrB, item.key, 0) : null, [storeB, arrB, item])
  const gradeNames = [...new Set([...Object.keys(det.gradeCounts), ...(detB ? Object.keys(detB.gradeCounts) : [])])]
  const grades = [...GRADE_ORDER.filter((g) => gradeNames.includes(g)), ...gradeNames.filter((g) => !GRADE_ORDER.includes(g))]
    .map((g) => ({ name: g, cnt: det.gradeCounts[g] || 0, cntB: detB ? (detB.gradeCounts[g] || 0) : null }))
  const downloadCsv = () => {
    const csv = memberCsv(store, arr, item.key)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `회원유형_${item.label}_${todayStr}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }
  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) onClose() }} width={900} maxHeight="88vh">
      <Layout
        header={<DialogHeader title={`${item.label} · ${comma(det.total)}명`}
                              subtitle={`기준: ${item.desc} · SMS 수신동의 ${comma(det.smsOk)}명 (${det.total ? (det.smsOk / det.total * 100).toFixed(1) : 0}%) · APP 설치 ${comma(det.appOk)}명 (${det.total ? (det.appOk / det.total * 100).toFixed(1) : 0}%)`}
                              onOpenChange={(open) => { if (!open) onClose() }} />}
        content={
          <LayoutContent>
            <Stack gap={3}>
              <Stack gap={1}>
                <Text type="label" weight="semibold">등급별 분포{detB ? ' — 기준 vs 비교' : ''}</Text>
                <ResponsiveContainer width="100%" height={Math.max(140, grades.length * (detB ? 54 : 36))}>
                  <BarChart data={grades} layout="vertical" margin={{ top: 4, right: 96, left: 8, bottom: 4 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={64} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <RTooltip formatter={(v, n) => [comma(v) + '명', n === 'cnt' ? '기준' : '비교']} cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
                    {detB && <Legend iconType="circle" iconSize={9}
                            formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v === 'cnt' ? '기준' : `비교 (${snapB})`}</span>} />}
                    <Bar dataKey="cnt" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#1c4f3a">
                      {!detB && grades.map((g) => <Cell key={g.name} fill={GRADE_COLORS[g.name] || '#97a3a0'} />)}
                      <LabelList dataKey="cnt" position="right"
                                 formatter={(v) => detB ? comma(v) : `${comma(v)} (${det.total ? (v / det.total * 100).toFixed(1) : 0}%)`}
                                 style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                    </Bar>
                    {detB && (
                      <Bar dataKey="cntB" radius={[0, 4, 4, 0]} maxBarSize={20} fill="#e6b422">
                        <LabelList dataKey="cntB" position="right" formatter={comma}
                                   style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
                {detB && (
                  <Text type="supporting" color="secondary">
                    인원 변화: {comma(detB.total)}명 → {comma(det.total)}명
                    ({det.total - detB.total >= 0 ? '+' : ''}{comma(det.total - detB.total)}명)
                    · 리스트와 CSV는 기준 데이터 기준이에요
                  </Text>
                )}
              </Stack>
              <Stack gap={1}>
                <Stack direction="horizontal" gap={2} vAlign="center">
                  <Text type="label" weight="semibold">회원 리스트</Text>
                  <Text type="supporting" color="secondary">상위 {comma(det.sample.length)}명 표시 · 전체는 CSV로</Text>
                  <div style={{ flex: 1 }} />
                  <Button label={`CSV 다운로드 (전체 ${comma(det.total)}명)`} variant="primary" size="sm" clickAction={downloadCsv} />
                </Stack>
                <Table
                  data={det.sample}
                  idKey="_id"
                  density="compact"
                  dividers="rows"
                  textOverflow="truncate"
                  columns={[
                    { key: 'id', header: '아이디' },
                    { key: 'name', header: '이름' },
                    { key: 'phone', header: '전화번호' },
                    { key: 'grade', header: '등급' },
                    { key: 'joined', header: '가입일' },
                    { key: 'lastBuy', header: '최종구매일', renderCell: (r) => r.lastBuy || '–' },
                    { key: 'qty', header: '구매수량', renderCell: (r) => comma(r.qty) },
                    { key: 'amt', header: '구매금액', renderCell: (r) => won(r.amt) },
                  ]}
                />
              </Stack>
            </Stack>
          </LayoutContent>
        }
      />
    </Dialog>
  )
}

function MemberTypeSection() {
  const aRef = useRef(null) // { store, cls }
  const bRef = useRef(null)
  const [filesA, setFilesA] = useState([])
  const [filesB, setFilesB] = useState([])
  const [ageTrendMode, setAgeTrendMode] = useState('stack')
  const [ageSel, setAgeSel] = useState(null)
  const [cmpOn, setCmpOn] = useState(false)
  const [joinOn, setJoinOn] = useState(false)
  const [joinRange, setJoinRange] = useState(null)
  const [busy, setBusy] = useState(false)
  const [prog, setProg] = useState({ msg: '', done: 0, total: 0 })
  const [error, setError] = useState(null)
  const [summary, setSummaryRaw] = useState(() => restoredOf('usertype'))
  const setSummary = (v) => { setSummaryRaw(v); if (v) registerSnap('usertype', { ...v, restored: true }) }
  const [restoreNote, setRestoreNote] = useState(false)
  const [sel, setSel] = useState(null)

  const joinFilter = joinOn && joinRange?.start && joinRange?.end ? joinRange : null

  // 워커에서 파싱 (버벅임 방지) — 워커 생성 실패 시 메인 스레드 폴백
  async function readFiles(list, label, store) {
    let worker = null
    try { worker = new MemberWorker() } catch { worker = null }
    try {
      for (let i = 0; i < list.length; i++) {
        setProg((p) => ({ ...p, msg: `[${label}] ${list[i].name} 처리 중… (누적 ${comma(store.n)}명)` }))
        if (worker) {
          const buf = await list[i].arrayBuffer()
          const proj = await new Promise((resolve, reject) => {
            const seq = i
            const onMsg = (e) => {
              if (e.data.seq !== seq) return
              worker.removeEventListener('message', onMsg)
              e.data.ok ? resolve(e.data.proj) : reject(new Error(e.data.error))
            }
            worker.addEventListener('message', onMsg)
            worker.onerror = (err) => reject(new Error('워커 오류: ' + (err.message || '알 수 없음')))
            worker.postMessage({ seq, buf, name: list[i].name }, [buf])
          })
          mergeProjected(store, proj)
        } else {
          await sleep(30)
          const p = await parseOrderFile(list[i])
          addMembersToStore(store, p.headers, p.data)
        }
        setProg((pp) => ({ ...pp, done: pp.done + 1, msg: `[${label}] ${list[i].name} 완료 (누적 ${comma(store.n)}명)` }))
      }
    } finally {
      if (worker) worker.terminate()
    }
  }

  function rebuildSummary() {
    const mk = (ref, withAge) => {
      if (!ref.current) return null
      const { store } = ref.current
      const snap = store.maxDate || iso(new Date())
      const cls = classifyMembers(store, snap, joinFilter)
      ref.current.cls = cls
      let age
      if (withAge) {
        const full = computeAgeAnalysis(store, snap, joinFilter)
        ref.current.ageArr = full.assign
        age = { dist: full.dist, withBirth: full.withBirth, included: full.included,
                invalid: full.invalid, trend: full.trend, trendTruncated: full.trendTruncated }
      }
      return { n: store.n, excluded: store.excluded, dup: store.dup, snap,
               included: cls.included, counts: cls.counts, age }
    }
    const a = mk(aRef, true)
    if (!a) {
      // 원본 데이터 없이(저장본 복원 상태) 필터 변경 시 — 저장 요약 유지 + 안내
      if (summary?.restored) { setRestoreNote(true); return }
      setSummary(null); return
    }
    setSummary({ a, b: mk(bRef, false) })
  }

  const onFilesA = async (fs) => {
    const list = !fs ? [] : Array.isArray(fs) ? fs : [fs]
    setFilesA(list); setError(null)
    aRef.current = null; setSummary(null)
    if (!list.length) return
    setBusy(true); setProg({ msg: '', done: 0, total: list.length })
    try {
      const store = newMemberStore()
      await readFiles(list, '기준', store)
      aRef.current = { store, cls: null }
      rebuildSummary()
    } catch (e) { setError(e.message || String(e)) }
    finally { setBusy(false) }
  }

  const onFilesB = async (fs) => {
    const list = !fs ? [] : Array.isArray(fs) ? fs : [fs]
    setFilesB(list); setError(null)
    bRef.current = null
    if (!list.length) { rebuildSummary(); return }
    setBusy(true); setProg({ msg: '', done: 0, total: list.length })
    try {
      const store = newMemberStore()
      await readFiles(list, '비교', store)
      bRef.current = { store, cls: null }
      rebuildSummary()
    } catch (e) { setError(e.message || String(e)) }
    finally { setBusy(false) }
  }

  // 가입기간 필터 변경 시 재분류 (데이터 로드돼 있을 때만)
  const applyFilter = () => rebuildSummary()
  const clearFilter = () => { setJoinOn(false); setJoinRange(null); setTimeout(rebuildSummary, 0) }

  const arrOf = (ref, name) => name === 'lifecycle' ? ref.current.cls.lifecycle : name === 'activity' ? ref.current.cls.activity : ref.current.cls.segment

  const renderCards = (title, defs, countsKey) => (
    <>
      <Text type="label" weight="semibold">{title}</Text>
      <Grid columns={{ minWidth: countsKey === 'segment' ? 300 : 250, repeat: 'fit' }} gap={3}>
        {defs.map((d, i) => (
          <MemberTypeCard key={d.key} label={d.label}
                          count={summary.a.counts[countsKey][i]}
                          prev={summary.b ? summary.b.counts[countsKey][i] : null}
                          total={summary.a.included}
                          desc={d.desc} action={d.action}
                          onClick={() => aRef.current ? setSel({ arrName: countsKey, item: d }) : setRestoreNote(true)} />
        ))}
      </Grid>
    </>
  )

  return (
    <Stack gap={4}>
      <Grid columns={{ minWidth: 420, repeat: 'fit' }} gap={3}>
        <SnapCard>
          <FileInput
            label="기준 데이터 (최신 내보내기 — 분할 파일 전부 선택)"
            description="FLEXG 회원 내보내기 .xlsx 12~13개 한꺼번에 선택 — 브라우저 안에서만 처리"
            value={filesA}
            onChange={onFilesA}
            accept=".xls,.xlsx,.csv"
            mode="dropzone"
            isMultiple
          />
        </SnapCard>
        {cmpOn ? (
          <SnapCard>
            <Stack gap={2}>
              <FileInput
                label="비교 데이터 (과거 시점 내보내기)"
                description="이전에 받아둔 회원 내보내기 — 기준일은 데이터에서 자동 추정돼요"
                value={filesB}
                onChange={onFilesB}
                accept=".xls,.xlsx,.csv"
                mode="dropzone"
                isMultiple
              />
              <Button label="비교 제거" variant="ghost" size="sm"
                      clickAction={() => { setCmpOn(false); setFilesB([]); bRef.current = null; rebuildSummary() }} />
            </Stack>
          </SnapCard>
        ) : (
          <SnapCard>
            <Stack gap={2} vAlign="center" hAlign="center" style={{ minHeight: 120 }}>
              <Button label="+ 비교 데이터 추가" variant="secondary" clickAction={() => setCmpOn(true)} />
              <Text type="supporting" color="secondary">과거 시점 회원 내보내기를 넣으면 카드마다 변화량이 표시돼요</Text>
            </Stack>
          </SnapCard>
        )}
      </Grid>

      {summary && (
        <SnapCard>
          <Stack direction="horizontal" gap={3} vAlign="end" wrap="wrap">
            {joinOn ? (
              <>
                <DateRangeInput label="회원가입 기간" value={joinRange} onChange={setJoinRange} presets={PRESETS} />
                <Button label="적용" variant="primary" size="sm" clickAction={applyFilter} />
                <Button label="해제" variant="ghost" size="sm" clickAction={clearFilter} />
              </>
            ) : (
              <Button label="+ 회원가입 기간 지정" variant="secondary" clickAction={() => setJoinOn(true)} />
            )}
            <Text type="supporting" color="secondary">
              지정한 기간에 가입한 회원만 집계돼요 (비교 데이터에도 동일 적용)
            </Text>
          </Stack>
        </SnapCard>
      )}

      {busy && <ProgressBar done={prog.done} total={prog.total} msg={prog.msg} />}
      {error && <Banner status="error" title="처리 실패" description={error} />}

      {summary && (
        <>
          {restoreNote && (
            <Banner status="info" title="저장된 집계 결과"
                    description="카드 숫자는 스냅샷에서 복원됐어요. 가입기간 필터 변경, 등급 분포, 회원 리스트, CSV는 회원 파일을 다시 업로드해야 쓸 수 있어요." />
          )}
          <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
            <Text type="label" weight="semibold">
              {joinFilter ? `기간 내 가입 ${comma(summary.a.included)}명 / 전체 ${comma(summary.a.n)}명` : `총 ${comma(summary.a.n)}명`}
            </Text>
            <Text type="supporting" color="secondary">
              기준일(추정) {summary.a.snap}
              {summary.b ? ` · 비교 기준일(추정) ${summary.b.snap} · 비교 ${comma(summary.b.included)}명` : ''}
              {' '}· 사용중 아님 {comma(summary.a.excluded)}명 제외 · 중복 {comma(summary.a.dup)}명 제거 · 카드 클릭 = 등급 분포·리스트
            </Text>
          </Stack>

          {renderCards('생애주기 — 어디까지 왔는가', LIFECYCLE_DEFS, 'lifecycle')}
          {renderCards('활동성 — 살아있는가', ACTIVITY_DEFS, 'activity')}
          {renderCards('세그먼트 — 다음 액션 기준 (상호배타)', SEGMENT_DEFS, 'segment')}

          {/* 연령대 분석 (v48) */}
          {summary.a.age && summary.a.age.withBirth > 0 && (() => {
            const age = summary.a.age
            const pctOf = (n, d) => d ? (n / d * 100).toFixed(1) : '0.0'
            const distRows = AGE_BUCKETS.map((bk, k) => ({ name: bk, cnt: age.dist[k] }))
            const trendData = ageTrendMode === 'pct'
              ? age.trend.map((r) => {
                  const tot = AGE_BUCKETS.reduce((s, bk) => s + r[bk], 0)
                  const o = { ym: r.ym }
                  AGE_BUCKETS.forEach((bk) => { o[bk] = tot ? +(r[bk] / tot * 100).toFixed(1) : 0 })
                  return o
                })
              : age.trend
            return (
              <SnapCard>
                <Stack gap={3}>
                  <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                    <Text type="label" weight="semibold">연령대 분석</Text>
                    <Text type="supporting" color="secondary">
                      생년월일 보유 {comma(age.withBirth)}명 ({pctOf(age.withBirth, age.included)}%) 기준
                      {age.invalid > 0 ? ` · 형식 오류로 제외 ${comma(age.invalid)}건` : ''}
                      {joinFilter ? ' · 기간 내 가입자 대상' : ''}
                    </Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text type="supporting" weight="semibold">
                      연령대 분포 (조회 시점 만 나이 · 기준일 {summary.a.snap})
                      {aRef.current?.ageArr ? ' · 막대/연령대명 클릭 = 회원 리스트' : ''}
                    </Text>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={distRows} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}
                                onClick={(st) => {
                                  const nm = st?.activeLabel
                                  const k = AGE_BUCKETS.indexOf(nm)
                                  if (k >= 0 && aRef.current?.ageArr) setAgeSel({ idx: k, label: nm })
                                }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={comma} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={56} />
                        <RTooltip formatter={(v) => [comma(v) + '명', '인원']} cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
                        <Bar dataKey="cnt" radius={[4, 4, 0, 0]} maxBarSize={56}
                             style={aRef.current?.ageArr ? { cursor: 'pointer' } : undefined}>
                          {distRows.map((r, k) => <Cell key={r.name} fill={AGE_COLORS[k]} />)}
                          <LabelList dataKey="cnt" position="top" formatter={comma}
                                     style={{ fontSize: 11, fontWeight: 600, fill: 'var(--color-text-primary)' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <Table data={distRows} idKey="name" density="compact" dividers="rows"
                           columns={[
                             { key: 'name', header: '연령대', renderCell: (r) => aRef.current?.ageArr ? (
                                 <span onClick={() => setAgeSel({ idx: AGE_BUCKETS.indexOf(r.name), label: r.name })}
                                       style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                                   {r.name}
                                 </span>
                               ) : r.name },
                             { key: 'cnt', header: '인원', renderCell: (r) => comma(r.cnt) + '명' },
                             { key: 'pct', header: '비중', renderCell: (r) => pctOf(r.cnt, age.withBirth) + '%' },
                           ]} />
                  </Stack>
                  {age.trend.length > 0 && (
                    <Stack gap={2}>
                      <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                        <Text type="supporting" weight="semibold">월별 가입자 연령대 추이 (가입 당시 만 나이)</Text>
                        {age.trendTruncated && <Badge variant="neutral" label="최근 36개월만 표시" />}
                        <div style={{ flex: 1 }} />
                        <TabList value={ageTrendMode} onChange={setAgeTrendMode} size="sm">
                          <Tab value="stack" label="스택" />
                          <Tab value="pct" label="100%" />
                        </TabList>
                      </Stack>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                          <XAxis dataKey="ym" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                                 interval={trendData.length > 18 ? 2 : 0} angle={trendData.length > 12 ? -35 : 0}
                                 height={trendData.length > 12 ? 46 : 30} textAnchor={trendData.length > 12 ? 'end' : 'middle'} />
                          <YAxis tickFormatter={ageTrendMode === 'pct' ? (v) => v + '%' : comma}
                                 tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={56}
                                 domain={ageTrendMode === 'pct' ? [0, 100] : undefined} />
                          <RTooltip formatter={(v, n) => [ageTrendMode === 'pct' ? v + '%' : comma(v) + '명', n]}
                                    cursor={{ fill: 'rgba(28,79,58,0.06)' }} />
                          <Legend iconType="circle" iconSize={9}
                                  formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span>} />
                          {AGE_BUCKETS.map((bk, k) => (
                            <Bar key={bk} dataKey={bk} stackId="age" fill={AGE_COLORS[k]} maxBarSize={40} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </Stack>
                  )}
                </Stack>
              </SnapCard>
            )
          })()}
        </>
      )}

      {ageSel && aRef.current?.ageArr && (
        <MemberListDialog store={aRef.current.store} arr={aRef.current.ageArr}
                          item={{ key: ageSel.idx, label: ageSel.label,
                                  desc: `조회 시점 만 나이 기준 (기준일 ${summary?.a?.snap || ''})${joinFilter ? ' · 기간 내 가입자' : ''}` }}
                          todayStr={summary?.a?.snap || iso(new Date())} onClose={() => setAgeSel(null)} />
      )}
      {sel && aRef.current && (
        <MemberListDialog store={aRef.current.store} arr={arrOf(aRef, sel.arrName)} item={sel.item}
                          storeB={bRef.current?.store} arrB={bRef.current ? arrOf(bRef, sel.arrName) : null}
                          snapB={summary?.b?.snap}
                          todayStr={summary?.a?.snap || iso(new Date())} onClose={() => setSel(null)} />
      )}
    </Stack>
  )
}

/* ══════════════════ 조회 결과 저장/복원 (localStorage) ══════════════════ */

const SNAP_KEY = 'jwbm_snapshot_v1'
// 뷰어 모드: HTML 내보내기 파일이 window.__JWBM_VIEWER__에 스냅샷을 심어둠
export const VIEWER = typeof window !== 'undefined' && !!window.__JWBM_VIEWER__
// 각 섹션이 조회 결과를 여기에 등록 → 저장 버튼이 통째로 localStorage에 기록
if (typeof window !== 'undefined') window.__jwbm = window.__jwbm || {}

export function registerSnap(section, data) {
  if (typeof window !== 'undefined') window.__jwbm[section] = data
}
export function loadSnapshot() {
  try {
    const raw = localStorage.getItem(SNAP_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
export function saveSnapshot() {
  const payload = { savedAt: new Date().toLocaleString('ko-KR'), state: window.__jwbm }
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(payload))
    return { ok: true, savedAt: payload.savedAt }
  } catch (e) {
    // 용량 초과 시 큰 섹션(주문서)을 빼고 재시도
    try {
      const { orders, ...rest } = window.__jwbm
      localStorage.setItem(SNAP_KEY, JSON.stringify({ savedAt: payload.savedAt, state: rest, ordersDropped: true }))
      return { ok: true, savedAt: payload.savedAt, ordersDropped: true }
    } catch {
      return { ok: false, error: '브라우저 저장 공간이 부족해요.' }
    }
  }
}
export function clearSnapshot() {
  try { localStorage.removeItem(SNAP_KEY) } catch { /* 무시 */ }
}
// 현재 스냅샷 (시작 시 localStorage에서, 파일 불러오기 시 교체)
let CURRENT_SNAP = typeof window !== 'undefined'
  ? (VIEWER ? window.__JWBM_VIEWER__ : loadSnapshot())
  : null
// 부팅 시 저장본(localStorage 또는 뷰어 임베드)을 내보내기 버퍼에 시드
// — 복원만 하고 재조회 안 한 섹션도 HTML 내보내기에 포함되도록
if (typeof window !== 'undefined') window.__jwbm = { ...(CURRENT_SNAP?.state || {}), ...(window.__jwbm || {}) }
export const restoredOf = (section) => CURRENT_SNAP?.state?.[section] || null
export const snapSavedAt = () => CURRENT_SNAP?.savedAt || null

export function exportSnapshotFile() {
  const r = saveSnapshot() // localStorage에도 동시 저장
  if (!r.ok) return r
  const payload = localStorage.getItem(SNAP_KEY)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
  const stamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '')
  a.download = `제철밥상_조회스냅샷_${stamp}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  return r
}

export async function importSnapshotFile(file) {
  const text = await file.text()
  const parsed = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object' || !parsed.state) throw new Error('스냅샷 파일 형식이 아니에요.')
  CURRENT_SNAP = parsed
  window.__jwbm = { ...parsed.state }
  try { localStorage.setItem(SNAP_KEY, JSON.stringify(parsed)) } catch { /* 용량 초과 시 메모리로만 */ }
  return parsed
}

const BUNDLE_RAW_URL = 'https://raw.githubusercontent.com/lynn03351/jwbm-assets/main/jwbm_sales_dashboard.js'
export function exportViewerHtml() {
  try {
    const payload = { savedAt: new Date().toLocaleString('ko-KR'), state: window.__jwbm }
    const json = JSON.stringify(payload).replace(/<\/script/gi, '<\\/script')
    const bundlePromise = window.__JWBM_BUNDLE_SRC__
      ? Promise.resolve(window.__JWBM_BUNDLE_SRC__)
      : fetch(BUNDLE_RAW_URL).then((r) => { if (!r.ok) throw new Error('번들 다운로드 실패'); return r.text() })
    bundlePromise.then((code) => {
      const html = [
        '<!doctype html>',
        '<html lang="ko"><head><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '<title>제철밥상 매출 대시보드 — 저장본</title></head><body>',
        '<scr' + 'ipt>window.__JWBM_VIEWER__ = ' + json + '</scr' + 'ipt>',
        '<scr' + 'ipt>window.__JWBM_BUNDLE_SRC__ = null</scr' + 'ipt>',
        '<scr' + 'ipt>' + code.replace(/<\/script/gi, '<\\/script') + '</scr' + 'ipt>',
        '</body></html>',
      ].join('\n')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      const stamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '')
      a.download = `제철밥상_매출_대시보드_${stamp}.html`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    }).catch(() => { /* 무시 */ })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message || String(e) }
  }
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 20 }}>
          <Banner status="error" title="화면 렌더링 중 오류가 발생했어요"
                  description={`이 메시지를 캡처해서 공유해주세요: ${this.state.err?.message || String(this.state.err)}`} />
        </div>
      )
    }
    return this.props.children
  }
}

/* ══════════════════ 메인 ══════════════════ */

/* ══════════════════ 상품추천 — 클릭/구매전환 (v50) ══════════════════ */

// FLEXG 클릭/구매전환 직접 조회 — 페이지당 1000개, 부족할 때까지 순회 (최대 5페이지)
async function fetchSalesClickRange(from, to, onPage) {
  const all = []
  for (let page = 1; page <= 5; page++) {
    if (onPage) onPage(page)
    const url = `/Statistics/salesclick?pagesize=1000&page=${page}&date_from=${from}&date_to=${to}&sort_num=1&tags=&mg_code=&mg_name=&cateidxs=&catenames=`
    const r = await fetch(url, { credentials: 'include' })
    if (!r.ok) throw new Error(`조회 실패 (${r.status}) — FLEXG 로그인 상태를 확인해주세요.`)
    const p = parseSalesClickLive(await r.text(), from, to)
    all.push(...p.products)
    if (p.products.length < 1000) break
    await sleep(250)
  }
  return { products: all }
}

const clickBadgeHint = '🔥 고전환 (전환율 상위 25% · 주문 5+) · 📈 꾸준 (꾸준지수 60점+) · ⚡ 스파이크 (하루 몰림 50%+)'

function ClickTrendDialog({ row, onClose }) {
  const data = row.daily.map((d) => ({ ...d, label: d.date.slice(5) }))
  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) onClose() }} width={760} maxHeight="85vh">
      <Layout
        header={<DialogHeader title={row.name}
                              subtitle={`${row.code} · 클릭 ${comma(row.clicks)} · 주문 ${comma(row.orders)} (${row.cvr.toFixed(2)}%)${row.spikeDate ? ` · 최대 주문일 ${row.spikeDate}` : ''}`}
                              onOpenChange={(open) => { if (!open) onClose() }} />}
        content={
          <LayoutContent>
            <Stack gap={2}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                         interval={data.length > 20 ? Math.floor(data.length / 12) : 0} />
                  <YAxis yAxisId="o" tickFormatter={comma} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
                  <YAxis yAxisId="c" orientation="right" tickFormatter={comma} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={54} />
                  <RTooltip formatter={(v, n) => [comma(v) + (n === '클릭' ? '회' : '건'), n]} />
                  <Legend iconType="circle" iconSize={9}
                          formatter={(v) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v}</span>} />
                  <Bar yAxisId="o" dataKey="orders" name="주문" fill="#1c4f3a" radius={[3, 3, 0, 0]} maxBarSize={26} />
                  <Line yAxisId="c" dataKey="clicks" name="클릭" stroke="#e6b422" strokeWidth={2} dot={data.length <= 40} />
                </ComposedChart>
              </ResponsiveContainer>
              <Text type="supporting" color="secondary">
                막대 = 일별 주문 (좌축) · 선 = 일별 클릭 (우축) — 특정일 몰림(밴드·카톡 발송)이 한눈에 보여요
              </Text>
            </Stack>
          </LayoutContent>
        }
      />
    </Dialog>
  )
}

function ClickRankTable({ rows, onPick, showSteady }) {
  const [sort, setSort] = useState([])
  const sortPlugin = useTableSortable({ sort, onSortChange: setSort })
  const view = useMemo(() => {
    let out = rows
    if (sort.length) {
      const { sortKey, direction } = sort[0]
      out = [...rows].sort((x, y) => {
        const av = x[sortKey] ?? -Infinity, bv = y[sortKey] ?? -Infinity
        const d = av > bv ? 1 : av < bv ? -1 : 0
        return direction === 'ascending' ? d : -d
      })
    }
    return out.map((r, i) => ({ ...r, rank: i + 1 }))
  }, [rows, sort])
  return (
    <Table data={view} idKey="code" density="compact" dividers="rows" textOverflow="truncate"
           plugins={{ sort: sortPlugin }}
           columns={[
             { key: 'rank', header: '#' },
             { key: 'name', header: '상품명', renderCell: (r) => (
                 <span onClick={() => onPick(r)}
                       style={{ cursor: 'pointer', color: 'var(--color-text-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                   {r.name}
                 </span>
               ) },
             { key: 'badges', header: '', renderCell: (r) => r.badges.join(' ') },
             { key: 'clicks', header: '클릭', sortable: true, renderCell: (r) => comma(r.clicks) },
             { key: 'orders', header: '주문', sortable: true, renderCell: (r) => comma(r.orders) },
             { key: 'cvr', header: '전환율', sortable: true, renderCell: (r) => <b>{r.cvr.toFixed(2)}%</b> },
             { key: 'normalCvr', header: '평상시', sortable: true, renderCell: (r) => r.normalCvr == null ? '–' : r.normalCvr.toFixed(2) + '%' },
             ...(showSteady ? [{ key: 'steady', header: '꾸준지수', sortable: true, renderCell: (r) => (
                 <Badge variant={r.steady >= 60 ? 'success' : r.steady >= 30 ? 'neutral' : 'warning'} label={`${r.steady}점`} />
               ) }] : []),
           ]} />
  )
}

function SalesClickSection() {
  const [files, setFiles] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(() => restoredOf('salesclick'))
  const [minClicksText, setMinClicksText] = useState('50')
  const [pick, setPick] = useState(null)
  const [qRange, setQRange] = useState(lastWeekRange())
  const [qMsg, setQMsg] = useState('')
  const minClicks = Math.max(0, parseInt(minClicksText, 10) || 0)

  const apply = (parsedList, srcLabel) => {
    const merged = mergeSalesClick(parsedList)
    if (!merged.products.length) throw new Error('상품 데이터가 없어요.')
    const metrics = computeClickMetrics(merged)
    const out = { rows: metrics.rows, dates: merged.dates, days: metrics.days,
                  files: srcLabel, restored: true }
    setRes(out)
    registerSnap('salesclick', out)
  }

  const runQuery = async () => {
    if (!qRange?.start || !qRange?.end) { setError('기간을 선택해주세요.'); return }
    setBusy(true); setError(null); setQMsg('')
    try {
      const fetched = await fetchSalesClickRange(qRange.start, qRange.end,
        (pg) => setQMsg(`${pg}페이지 조회 중… (1,000개 단위)`))
      apply([fetched], [`직접 조회 ${qRange.start} ~ ${qRange.end} (${comma(fetched.products.length)}개)`])
    } catch (e) { setError(e.message || String(e)) }
    finally { setBusy(false); setQMsg('') }
  }


  const onFiles = async (fs) => {
    const list = !fs ? [] : Array.isArray(fs) ? fs : [fs]
    setFiles(list); setError(null)
    if (!list.length) { setRes(null); return }
    setBusy(true)
    try {
      const parsedList = []
      for (const f of list) {
        const buf = await f.arrayBuffer()
        let text = new TextDecoder('utf-8').decode(buf)
        if (!/<tr/i.test(text)) text = new TextDecoder('euc-kr').decode(buf)
        const dm = String(f.name).match(/(\d{4})-(\d{2})-\d{2}/)
        const y = dm ? +dm[1] : yearFromFilename(f.name)
        const mo = dm ? +dm[2] : null
        parsedList.push(parseSalesClick(text, y, mo))
      }
      apply(parsedList, list.map((f) => f.name))
    } catch (e) { setError(e.message || String(e)) }
    finally { setBusy(false) }
  }

  const totals = useMemo(() => {
    if (!res) return null
    const clicks = res.rows.reduce((s, r) => s + r.clicks, 0)
    const orders = res.rows.reduce((s, r) => s + r.orders, 0)
    return { clicks, orders, cvr: clicks ? orders / clicks * 100 : 0 }
  }, [res])

  const topCvr = useMemo(() => {
    if (!res) return []
    return res.rows.filter((r) => r.clicks >= minClicks && r.orders > 0)
      .sort((a, b) => b.cvr - a.cvr || b.orders - a.orders)
      .slice(0, 20).map((r, i) => ({ ...r, rank: i + 1 }))
  }, [res, minClicks])

  const topSteady = useMemo(() => {
    if (!res) return []
    return res.rows.filter((r) => r.orders >= 5)
      .sort((a, b) => b.steady - a.steady || b.orders - a.orders)
      .slice(0, 20).map((r, i) => ({ ...r, rank: i + 1 }))
  }, [res])

  const limited = useMemo(() => res ? limitedDealCandidates(res.rows) : null, [res])

  return (
    <Stack gap={4}>
      {!VIEWER && (<>
      <Card padding={3}>
        <Stack gap={3}>
          <Stack direction="horizontal" gap={3} vAlign="end" wrap="wrap">
            <DateRangeInput label="조회 기간" value={qRange} onChange={setQRange} presets={PRESETS} />
            <Button label={busy ? '조회 중…' : '클릭/전환 불러오기'} variant="primary" isDisabled={busy} clickAction={runQuery} />
          </Stack>
          <Text type="supporting" color="secondary">
            FLEXG 통계에서 바로 조회 (엑셀 불필요) · 클릭 상위부터 1,000개 단위로 전부 가져와요{qMsg ? ` — ${qMsg}` : ''}
          </Text>
        </Stack>
      </Card>
      <Card padding={3}>
        <FileInput
          label="또는: 기간별 클릭/구매전환 파일 업로드 (여러 개 가능)"
          description="FLEXG 통계 > 기간별 클릭/구매전환 내보내기 (.xls) — 여러 기간 파일을 함께 올리면 날짜가 이어붙어요 (같은 날짜는 나중 파일 우선) · 파일명의 날짜로 연도를 인식해요"
          value={files}
          onChange={onFiles}
          accept=".xls,.xlsx,.html"
          mode="dropzone"
          isMultiple
        />
      </Card>
      </>)}
      {busy && <Banner status="info" title="파싱 중…" description="파일을 읽고 있어요." />}
      {error && <Banner status="error" title="파일 읽기 실패" description={error} />}
      {res && totals && (
        <>
          {res.restored && !files.length && (
            <Banner status="info" title="저장된 분석 결과"
                    description={`저장본 기준 — ${(res.files || []).join(', ') || '파일 정보 없음'}`} />
          )}
          <Stack gap={0.5}>
            <Text type="label" weight="semibold">{res.dates[0]} ~ {res.dates[res.dates.length - 1]} · {res.days}일</Text>
            <Text type="supporting" color="secondary">
              클릭 상위 {comma(res.rows.length)}개 상품 기준 (FLEXG 내보내기 범위) — 전체 상품이 아니에요
            </Text>
          </Stack>
          <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={3}>
            <Kpi label="상품 수" value={comma(res.rows.length) + '개'} />
            <Kpi label="총 클릭" value={comma(totals.clicks)} />
            <Kpi label="총 주문" value={comma(totals.orders) + '건'} />
            <Kpi label="평균 전환율" value={totals.cvr.toFixed(2) + '%'} />
          </Grid>

          {/* 카드 1: 주문전환 TOP 20 */}
          <SnapCard>
            <Stack gap={2}>
              <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                <Text type="label" weight="semibold">🔥 주문전환 TOP 20</Text>
                <Text type="supporting" color="secondary">전환율 = 합계 주문 ÷ 합계 클릭 · 평상시 = 최대 주문일 제외 재계산</Text>
                <div style={{ flex: 1 }} />
                <div style={{ width: 130 }}>
                  <TextInput label="최소 클릭" value={minClicksText} onChange={setMinClicksText} />
                </div>
              </Stack>
              <ClickRankTable rows={topCvr} onPick={setPick} showSteady />
              <Text type="supporting" color="secondary">{clickBadgeHint}</Text>
            </Stack>
          </SnapCard>

          {/* 카드 2: 꾸준한 주문 TOP 20 */}
          <SnapCard>
            <Stack gap={2}>
              <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                <Text type="label" weight="semibold">📈 꾸준한 주문 TOP 20</Text>
                <Text type="supporting" color="secondary">
                  꾸준지수 = 지속률 × (1 − 집중도) × 100 — 매일 팔리고 한 날에 안 몰릴수록 100점 · 주문 5건 이상만
                </Text>
              </Stack>
              <ClickRankTable rows={topSteady} onPick={setPick} showSteady />
            </Stack>
          </SnapCard>

          {/* 카드 3: 한정특가 후보 */}
          <SnapCard>
            <Stack gap={2}>
              <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                <Text type="label" weight="semibold">💎 한정특가 후보</Text>
                <Text type="supporting" color="secondary">
                  클릭 50+ 상품 {comma(limited?.eligible || 0)}개 중 클릭 하위 40% 구간 (≤ {comma(limited?.threshold || 0)}클릭) & 주문 5+ → 전환율 상위 — 노출만 부족했던 숨은 보석
                </Text>
              </Stack>
              {limited && limited.rows.length > 0 ? (
                <ClickRankTable rows={limited.rows.map((r, i) => ({ ...r, rank: i + 1 }))} onPick={setPick} showSteady />
              ) : (
                <Banner status="info" title="후보 없음"
                        description="클릭 50+ & 주문 5+ 조건을 만족하는 저노출 상품이 없어요 — 조회 기간을 늘리면 표본이 쌓여서 후보가 나올 수 있어요." />
              )}
            </Stack>
          </SnapCard>
        </>
      )}
      {!res && !busy && !error && (
        <Banner status="info" title="파일을 올려주세요"
                description="FLEXG 기간별 클릭/구매전환 엑셀을 올리면 주문전환 TOP · 꾸준한 주문 · 한정특가 후보를 추천해드려요." />
      )}
      {pick && <ClickTrendDialog row={pick} onClose={() => setPick(null)} />}
    </Stack>
  )
}

export default function FlexgDash() {
  const [tab, setTab] = useState('sales')
  const [snapMsg, setSnapMsg] = useState(null)

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 64px' }}>
      <Stack gap={4}>
        <Stack gap={0.5}>
          <Stack direction="horizontal" gap={1.5} vAlign="center">
            <Text type="display-2" weight="bold">제철밥상 데이터 조회</Text>
            <Badge variant="green" label="FLEXG 라이브" />
            <Badge variant="neutral" label="v50 · 상품추천" />
            {VIEWER && <Badge variant="green" label={`뷰어 모드 · ${snapSavedAt() || ''} 저장본`} />}
            <div style={{ flex: 1 }} />
            <div className="no-print">
              <Stack direction="horizontal" gap={1.5} vAlign="center">
                {snapMsg && <Badge variant="success" label={snapMsg} />}
                {!VIEWER && <Button label="HTML 내보내기" variant="secondary" size="sm"
                        clickAction={() => {
                          const r = exportViewerHtml()
                          setSnapMsg(r.ok ? '뷰어 HTML 다운로드됨 — 더블클릭으로 열면 돼요' : r.error)
                          setTimeout(() => setSnapMsg(null), 5000)
                        }} />}
                {!VIEWER && <Button label="결과 저장" variant="secondary" size="sm"
                        clickAction={() => {
                          const r = exportSnapshotFile()
                          setSnapMsg(r.ok ? `저장됨 · 파일 다운로드${r.ordersDropped ? ' (주문서는 파일에만)' : ''}` : r.error)
                          setTimeout(() => setSnapMsg(null), 4000)
                        }} />}
                {!VIEWER && <Button label="불러오기" variant="secondary" size="sm"
                        clickAction={() => document.getElementById('jwbm-snap-file')?.click()} />}
                <input id="jwbm-snap-file" type="file" accept=".json" style={{ display: 'none' }}
                       onChange={async (e) => {
                         const f = e.target.files?.[0]
                         e.target.value = ''
                         if (!f) return
                         try {
                           const p = await importSnapshotFile(f)
                           setSnapMsg(`복원됨 · ${p.savedAt} 저장본`)
                           setEpoch((x) => x + 1)
                           setTimeout(() => setSnapMsg(null), 4000)
                         } catch (err) { setSnapMsg('불러오기 실패: ' + (err.message || err)) }
                       }} />
                <Button label="PDF 저장" variant="secondary" size="sm" clickAction={() => window.print()} />
              </Stack>
            </div>
          </Stack>
          <Text color="secondary">정상금액 · 결제건수 기준 (매출기입 도구와 동일 산출식)</Text>
        </Stack>

        <div className="no-print">
        <TabList value={tab} onChange={setTab}>
          <Tab value="sales" label="📊 매출" />
          <Tab value="members" label="👥 회원" />
          <Tab value="orders" label="🧾 주문서" />
          <Tab value="promo" label="🎪 기획전" />
          <Tab value="coupon" label="🎟️ 쿠폰" />
          <Tab value="usertype" label="🧬 회원유형" />
          <Tab value="salesclick" label="🖱️ 상품추천" />
        </TabList>
        </div>

        <div style={{ display: tab === 'sales' ? 'block' : 'none' }}><ErrorBoundary><SalesSection /></ErrorBoundary></div>
        <div style={{ display: tab === 'members' ? 'block' : 'none' }}><ErrorBoundary><MembersSection /></ErrorBoundary></div>
        <div style={{ display: tab === 'orders' ? 'block' : 'none' }}><ErrorBoundary><OrdersSection /></ErrorBoundary></div>
        <div style={{ display: tab === 'promo' ? 'block' : 'none' }}><ErrorBoundary><PromoSection /></ErrorBoundary></div>
        <div style={{ display: tab === 'coupon' ? 'block' : 'none' }}><ErrorBoundary><CouponSection /></ErrorBoundary></div>
        <div style={{ display: tab === 'usertype' ? 'block' : 'none' }}><ErrorBoundary><MemberTypeSection /></ErrorBoundary></div>
        <div style={{ display: tab === 'salesclick' ? 'block' : 'none' }}><ErrorBoundary><SalesClickSection /></ErrorBoundary></div>

        <Divider />
        <Text type="supporting" color="secondary">
          제철밥상 자사몰 관리팀 · FLEXG 세션으로 실시간 조회 · Astryx (Meta, Beta) 기반
        </Text>
      </Stack>
    </div>
  )
}
