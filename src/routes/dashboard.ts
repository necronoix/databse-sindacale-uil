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

// Dashboard statistiche principali
dashboard.get('/stats', authMiddleware, async (c) => {
  try {
    // Conteggio totale iscritti
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM iscritti
    `).first()

    // Iscritti per ruolo
    const ruoloResult = await c.env.DB.prepare(`
      SELECT ruolo, COUNT(*) as count
      FROM iscritti 
      WHERE ruolo IS NOT NULL
      GROUP BY ruolo
      ORDER BY count DESC
    `).all()

    // Iscritti per provincia
    const provinciaResult = await c.env.DB.prepare(`
      SELECT prov_iscrizione, COUNT(*) as count
      FROM iscritti 
      WHERE prov_iscrizione IS NOT NULL
      GROUP BY prov_iscrizione
      ORDER BY count DESC
      LIMIT 10
    `).all()

    // Nuovi iscritti nell'anno corrente  
    const nuoviResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM iscritti 
      WHERE strftime('%Y', data_iscrizione) = strftime('%Y', 'now')
    `).first()

    // Ultimi 5 iscritti
    const ultimiResult = await c.env.DB.prepare(`
      SELECT cognome, nome, ruolo, istituto, data_iscrizione
      FROM iscritti 
      ORDER BY data_iscrizione DESC 
      LIMIT 5
    `).all()

    // Prepara dati per i grafici
    const iscrittiPerRuolo: Record<string, number> = {}
    ruoloResult.results.forEach((row: any) => {
      iscrittiPerRuolo[row.ruolo] = row.count
    })

    const iscrittiPerProvincia: Record<string, number> = {}
    provinciaResult.results.forEach((row: any) => {
      iscrittiPerProvincia[row.prov_iscrizione] = row.count
    })

    return c.json({
      totalIscritti: totalResult?.total || 0,
      nuoviIscrittiAnno: nuoviResult?.count || 0,
      iscrittiPerRuolo,
      iscrittiPerProvincia,
      ultimiIscritti: ultimiResult.results
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return c.json({ error: 'Errore durante il recupero delle statistiche' }, 500)
  }
})

// Dashboard dati dettagliati
dashboard.get('/data', authMiddleware, async (c) => {
  try {
    // Statistiche generali
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_iscritti,
        COUNT(CASE WHEN data_iscrizione >= date('now', '-30 days') THEN 1 END) as nuovi_30_giorni,
        COUNT(CASE WHEN data_ultima_modifica >= date('now', '-7 days') THEN 1 END) as modificati_7_giorni,
        COUNT(DISTINCT prov_iscrizione) as province,
        COUNT(DISTINCT istituto) as istituti
      FROM iscritti
    `).first()

    // Distribuzione per provincia
    const provinceData = await c.env.DB.prepare(`
      SELECT prov_iscrizione as provincia, COUNT(*) as count
      FROM iscritti 
      WHERE prov_iscrizione IS NOT NULL
      GROUP BY prov_iscrizione
      ORDER BY count DESC
      LIMIT 15
    `).all()

    // Distribuzione per istituto
    const istitutoData = await c.env.DB.prepare(`
      SELECT istituto, COUNT(*) as count
      FROM iscritti 
      WHERE istituto IS NOT NULL
      GROUP BY istituto
      ORDER BY count DESC
      LIMIT 10
    `).all()

    // Andamento temporale (ultimi 12 mesi)
    const monthlyData = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', data_iscrizione) as mese,
        COUNT(*) as count
      FROM iscritti 
      WHERE data_iscrizione >= date('now', '-12 months')
      GROUP BY mese
      ORDER BY mese
    `).all()

    // Distribuzione per ruolo
    const ruoloData = await c.env.DB.prepare(`
      SELECT ruolo, COUNT(*) as count
      FROM iscritti 
      WHERE ruolo IS NOT NULL
      GROUP BY ruolo
      ORDER BY count DESC
    `).all()

    // Distribuzione per tipologia istituto
    const tipologiaData = await c.env.DB.prepare(`
      SELECT tipologia, COUNT(*) as count
      FROM iscritti 
      WHERE tipologia IS NOT NULL
      GROUP BY tipologia
      ORDER BY count DESC
    `).all()

    // Distribuzione per tipo contratto
    const contrattoData = await c.env.DB.prepare(`
      SELECT tipo_di_contratto, COUNT(*) as count
      FROM iscritti 
      WHERE tipo_di_contratto IS NOT NULL
      GROUP BY tipo_di_contratto
      ORDER BY count DESC
    `).all()

    return c.json({
      stats,
      charts: {
        province: provinceData.results,
        istituto: istitutoData.results,
        monthly: monthlyData.results,
        ruolo: ruoloData.results,
        tipologia: tipologiaData.results,
        contratto: contrattoData.results
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
        COUNT(*) as total_iscritti,
        ROUND(AVG(CAST(annorata as INTEGER)), 1) as media_anno,
        COUNT(CASE WHEN attuale = 'Pensionato' THEN 1 END) as pensionati,
        COUNT(CASE WHEN scadenza_contratto > date('now') THEN 1 END) as contratti_attivi,
        COUNT(DISTINCT qual_liv) as livelli_qualifica,
        ROUND(SUM(CAST(importoritenuta as REAL)), 2) as totale_ritenute
      FROM iscritti
    `).first()

    // Tendenze mensili
    const trends = await c.env.DB.prepare(`
      SELECT 
        'questo_mese' as periodo,
        COUNT(*) as count
      FROM iscritti 
      WHERE data_iscrizione >= date('now', 'start of month')
      
      UNION ALL
      
      SELECT 
        'mese_scorso' as periodo,
        COUNT(*) as count
      FROM iscritti 
      WHERE data_iscrizione >= date('now', '-1 month', 'start of month')
        AND data_iscrizione < date('now', 'start of month')
      
      UNION ALL
      
      SELECT 
        'questo_anno' as periodo,
        COUNT(*) as count
      FROM iscritti 
      WHERE data_iscrizione >= date('now', 'start of year')
    `).all()

    // Distribuzione geografica per regione Lazio
    const geoDistribution = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN UPPER(prov_iscrizione) IN ('RM', 'ROMA', 'ROME') THEN 'Roma'
          WHEN UPPER(prov_iscrizione) IN ('LT', 'LATINA') THEN 'Latina'
          WHEN UPPER(prov_iscrizione) IN ('FR', 'FROSINONE') THEN 'Frosinone'
          WHEN UPPER(prov_iscrizione) IN ('VT', 'VITERBO') THEN 'Viterbo'
          WHEN UPPER(prov_iscrizione) IN ('RI', 'RIETI') THEN 'Rieti'
          ELSE 'Altra provincia'
        END as regione,
        COUNT(*) as count
      FROM iscritti 
      WHERE prov_iscrizione IS NOT NULL
      GROUP BY regione
      ORDER BY count DESC
    `).all()

    // Analisi RSU/TAS
    const rsuTasData = await c.env.DB.prepare(`
      SELECT rsu_tas, COUNT(*) as count
      FROM iscritti 
      WHERE rsu_tas IS NOT NULL
      GROUP BY rsu_tas
      ORDER BY count DESC
    `).all()

    return c.json({
      kpis,
      trends: trends.results,
      geoDistribution: geoDistribution.results,
      rsuTas: rsuTasData.results
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
    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    // Applica filtri
    if (filters?.province?.length) {
      whereClause += ` AND prov_iscrizione IN (${filters.province.map(() => '?').join(',')})`
      params.push(...filters.province)
    }

    if (filters?.istituto?.length) {
      whereClause += ` AND istituto IN (${filters.istituto.map(() => '?').join(',')})`
      params.push(...filters.istituto)
    }

    if (filters?.ruolo?.length) {
      whereClause += ` AND ruolo IN (${filters.ruolo.map(() => '?').join(',')})`
      params.push(...filters.ruolo)
    }

    if (filters?.tipoContratto?.length) {
      whereClause += ` AND tipo_di_contratto IN (${filters.tipoContratto.map(() => '?').join(',')})`
      params.push(...filters.tipoContratto)
    }

    if (filters?.dateRange?.start) {
      whereClause += ' AND data_iscrizione >= ?'
      params.push(filters.dateRange.start)
    }

    if (filters?.dateRange?.end) {
      whereClause += ' AND data_iscrizione <= ?'
      params.push(filters.dateRange.end)
    }

    // Costruisci query
    const selectFields = groupBy.map((field: string) => `${field}`).join(', ')

    const metricFields = metrics.map((metric: string) => {
      switch (metric) {
        case 'count': return 'COUNT(*) as conteggio'
        case 'avg_import': return 'ROUND(AVG(CAST(importoritenuta as REAL)), 2) as media_ritenute'
        case 'sum_import': return 'ROUND(SUM(CAST(importoritenuta as REAL)), 2) as totale_ritenute'
        default: return 'COUNT(*) as conteggio'
      }
    }).join(', ')

    const query = `
      SELECT ${selectFields}, ${metricFields}
      FROM iscritti
      ${whereClause}
      GROUP BY ${groupBy.join(', ')}
      ORDER BY conteggio DESC
    `

    const result = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({
      data: result.results,
      filters,
      groupBy,
      metrics,
      query: query // Per debug
    })

  } catch (error) {
    console.error('Custom report error:', error)
    return c.json({ error: 'Errore durante la generazione del report personalizzato' }, 500)
  }
})

// Esporta dati per backup o analisi
dashboard.get('/export', authMiddleware, async (c) => {
  const format = c.req.query('format') || 'json'
  const limit = parseInt(c.req.query('limit') || '1000')

  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        cognome, nome, ruolo, istituto, tipologia, email, telefono,
        tipo_di_contratto, scadenza_contratto, prov_iscrizione, localita,
        data_iscrizione, rsu_tas, importoritenuta
      FROM iscritti 
      ORDER BY cognome, nome
      LIMIT ?
    `).bind(limit).all()

    if (format === 'csv') {
      // Converti in CSV
      const headers = Object.keys(result.results[0] || {})
      const csvContent = [
        headers.join(','),
        ...result.results.map((row: any) => 
          headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n')

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="iscritti_export_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return c.json({
      data: result.results,
      total: result.results.length,
      exportDate: new Date().toISOString()
    })

  } catch (error) {
    console.error('Export error:', error)
    return c.json({ error: 'Errore durante l\'esportazione dei dati' }, 500)
  }
})

export default dashboard