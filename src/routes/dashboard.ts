import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

const dashboard = new Hono<{ 
  Bindings: { 
    DB: D1Database; 
    JWT_SECRET: string 
  } 
}>()

// Middleware di autenticazione
const authMiddleware = jwt({
  secret: (c) => c.env.JWT_SECRET
})

// Dashboard dati principali
dashboard.get('/data', authMiddleware, async (c) => {
  try {
    // Statistiche generali
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_members,
        COUNT(CASE WHEN updated_at >= date('now', '-7 days') THEN 1 END) as updated_members,
        COUNT(DISTINCT prov) as provinces,
        COUNT(DISTINCT istituto) as institutes
      FROM members 
      WHERE is_active = 1
    `).first()

    // Distribuzione per provincia
    const provinceData = await c.env.DB.prepare(`
      SELECT prov, COUNT(*) as count
      FROM members 
      WHERE is_active = 1 AND prov IS NOT NULL
      GROUP BY prov
      ORDER BY count DESC
      LIMIT 15
    `).all()

    // Distribuzione per istituto
    const istitutoData = await c.env.DB.prepare(`
      SELECT istituto, COUNT(*) as count
      FROM members 
      WHERE is_active = 1 AND istituto IS NOT NULL
      GROUP BY istituto
      ORDER BY count DESC
      LIMIT 10
    `).all()

    // Andamento temporale (ultimi 12 mesi)
    const monthlyData = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM members 
      WHERE is_active = 1 
        AND created_at >= date('now', '-12 months')
      GROUP BY month
      ORDER BY month
    `).all()

    // Ruoli
    const ruoloData = await c.env.DB.prepare(`
      SELECT ruolo, COUNT(*) as count
      FROM members 
      WHERE is_active = 1 AND ruolo IS NOT NULL
      GROUP BY ruolo
      ORDER BY count DESC
    `).all()

    // Tipologie
    const tipologiaData = await c.env.DB.prepare(`
      SELECT tipologia, COUNT(*) as count
      FROM members 
      WHERE is_active = 1 AND tipologia IS NOT NULL
      GROUP BY tipologia
      ORDER BY count DESC
    `).all()

    return c.json({
      stats,
      charts: {
        province: provinceData.results,
        istituto: istitutoData.results,
        monthly: monthlyData.results,
        ruolo: ruoloData.results,
        tipologia: tipologiaData.results
      }
    })

  } catch (error) {
    console.error('Dashboard data error:', error)
    return c.json({ error: 'Errore durante il recupero dei dati della dashboard' }, 500)
  }
})

// KPI e metriche
dashboard.get('/kpi', authMiddleware, async (c) => {
  try {
    // KPI principali
    const kpis = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_members,
        ROUND(AVG(CAST(annoiscrizione as INTEGER)), 1) as avg_year,
        COUNT(CASE WHEN pensione = 'SI' THEN 1 END) as pensioners,
        COUNT(CASE WHEN traferimento IS NOT NULL THEN 1 END) as transfers,
        COUNT(CASE WHEN scadenzacontratto > date('now') THEN 1 END) as active_contracts,
        COUNT(DISTINCT qual_liv) as qualification_levels
      FROM members 
      WHERE is_active = 1
    `).first()

    // Tendenze
    const trends = await c.env.DB.prepare(`
      SELECT 
        'this_month' as period,
        COUNT(*) as count
      FROM members 
      WHERE is_active = 1 
        AND created_at >= date('now', 'start of month')
      
      UNION ALL
      
      SELECT 
        'last_month' as period,
        COUNT(*) as count
      FROM members 
      WHERE is_active = 1 
        AND created_at >= date('now', '-1 month', 'start of month')
        AND created_at < date('now', 'start of month')
      
      UNION ALL
      
      SELECT 
        'this_year' as period,
        COUNT(*) as count
      FROM members 
      WHERE is_active = 1 
        AND created_at >= date('now', 'start of year')
    `).all()

    // Distribuzione geografica
    const geoDistribution = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN prov IN ('RM', 'ROMA') THEN 'Roma'
          WHEN prov IN ('LT', 'LATINA') THEN 'Latina'
          WHEN prov IN ('FR', 'FROSINONE') THEN 'Frosinone'
          WHEN prov IN ('VT', 'VITERBO') THEN 'Viterbo'
          WHEN prov IN ('RI', 'RIETI') THEN 'Rieti'
          ELSE 'Altro'
        END as region,
        COUNT(*) as count
      FROM members 
      WHERE is_active = 1 AND prov IS NOT NULL
      GROUP BY region
      ORDER BY count DESC
    `).all()

    return c.json({
      kpis,
      trends: trends.results,
      geoDistribution: geoDistribution.results
    })

  } catch (error) {
    console.error('KPI error:', error)
    return c.json({ error: 'Errore durante il recupero dei KPI' }, 500)
  }
})

// Report personalizzati
dashboard.post('/report', authMiddleware, async (c) => {
  const { filters, groupBy, metrics } = await c.req.json()

  try {
    let whereClause = 'WHERE m.is_active = 1'
    const params: any[] = []

    // Applica filtri
    if (filters?.province?.length) {
      whereClause += ` AND m.prov IN (${filters.province.map(() => '?').join(',')})`
      params.push(...filters.province)
    }

    if (filters?.istituto?.length) {
      whereClause += ` AND m.istituto IN (${filters.istituto.map(() => '?').join(',')})`
      params.push(...filters.istituto)
    }

    if (filters?.ruolo?.length) {
      whereClause += ` AND m.ruolo IN (${filters.ruolo.map(() => '?').join(',')})`
      params.push(...filters.ruolo)
    }

    if (filters?.dateRange?.start) {
      whereClause += ' AND m.created_at >= ?'
      params.push(filters.dateRange.start)
    }

    if (filters?.dateRange?.end) {
      whereClause += ' AND m.created_at <= ?'
      params.push(filters.dateRange.end)
    }

    // Costruisci query
    const selectFields = groupBy.map((field: string) => {
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase()
      return `${dbField} as ${field}`
    }).join(', ')

    const metricFields = metrics.map((metric: string) => {
      switch (metric) {
        case 'count': return 'COUNT(*) as count'
        case 'avg_year': return 'ROUND(AVG(CAST(annoiscrizione as INTEGER)), 1) as avg_year'
        case 'sum_import': return 'ROUND(SUM(importoritenuta), 2) as total_import'
        default: return 'COUNT(*) as count'
      }
    }).join(', ')

    const query = `
      SELECT ${selectFields}, ${metricFields}
      FROM members m
      ${whereClause}
      GROUP BY ${groupBy.map((field: string) => field.replace(/([A-Z])/g, '_$1').toLowerCase()).join(', ')}
      ORDER BY count DESC
    `

    const result = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({
      data: result.results,
      filters,
      groupBy,
      metrics
    })

  } catch (error) {
    console.error('Custom report error:', error)
    return c.json({ error: 'Errore durante la generazione del report personalizzato' }, 500)
  }
})

export default dashboard