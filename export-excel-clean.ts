import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { exportType, data, metadata } = await req.json();

    console.log(`Generating Excel for type: ${exportType}`);

    const xlsxContent = generateExcelContent(exportType, data, metadata);

    return new Response(
      JSON.stringify({
        success: true,
        base64: xlsxContent,
        filename: `nova_${exportType}_${new Date().toISOString().split('T')[0]}.xlsx`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating Excel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateExcelContent(exportType: string, data: any, metadata: any): string {
  const rows = convertDataToRows(exportType, data);

  const simpleXML = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>${escapeXml(metadata?.title || exportType)}</Title>
    <Author>Nova Hub</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Size="11"/>
      <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="€#,##0.00"/>
    </Style>
    <Style ss:ID="Percentage">
      <NumberFormat ss:Format="0.00%"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(metadata?.title || 'Datos')}">
    <Table>
      ${rows.map((row, rowIndex) => `
        <Row${rowIndex === 0 ? ' ss:Height="20"' : ''}>
          ${row.map((cell, cellIndex) => {
            const isHeader = rowIndex === 0;
            const isNumber = typeof cell === 'number';
            const isCurrency = metadata?.currencyColumns?.includes(cellIndex);
            const isPercentage = metadata?.percentageColumns?.includes(cellIndex);

            let styleID = '';
            if (isHeader) styleID = ' ss:StyleID="Header"';
            else if (isCurrency) styleID = ' ss:StyleID="Currency"';
            else if (isPercentage) styleID = ' ss:StyleID="Percentage"';

            return `
            <Cell${styleID}>
              <Data ss:Type="${isNumber ? 'Number' : 'String'}">${escapeXml(String(cell ?? ''))}</Data>
            </Cell>`;
          }).join('')}
        </Row>
      `).join('')}
    </Table>
  </Worksheet>
</Workbook>`;

  return btoa(unescape(encodeURIComponent(simpleXML)));
}

function convertDataToRows(exportType: string, data: any): any[][] {
  if (!data) return [['No hay datos']];

  const dataArray = Array.isArray(data) ? data : [data];

  switch (exportType) {
    case 'obvs':
      return [
        ['Título', 'Tipo', 'Proyecto', 'Owner', 'Status', 'Facturación', 'Margen', 'Costes', 'Creado'],
        ...dataArray.map(o => [
          o.titulo || '',
          o.tipo || '',
          o.project_nombre || '',
          o.owner_nombre || '',
          o.status || '',
          o.facturacion || 0,
          o.margen || 0,
          o.costes || 0,
          o.created_at || ''
        ])
      ];

    case 'crm':
      return [
        ['Contacto', 'Empresa', 'Email', 'Teléfono', 'Pipeline Status', 'Valor Potencial', 'Próxima Acción', 'Fecha Acción', 'Notas'],
        ...dataArray.map(l => [
          l.nombre_contacto || '',
          l.empresa || '',
          l.email_contacto || '',
          l.telefono_contacto || '',
          l.pipeline_status || '',
          l.valor_potencial || 0,
          l.proxima_accion || '',
          l.proxima_accion_fecha || '',
          l.notas || ''
        ])
      ];

    case 'crm_cerrados':
      return [
        ['OBV', 'Empresa', 'Contacto', 'Email', 'Teléfono', 'Proyecto', 'Facturación', 'Margen', 'Owner', 'Fecha Cierre'],
        ...dataArray.map(c => [
          c.titulo || '',
          c.empresa || '',
          c.nombre_contacto || '',
          c.email_contacto || '',
          c.telefono_contacto || '',
          c.proyecto_nombre || '',
          c.facturacion || 0,
          c.margen || 0,
          c.owner_nombre || '',
          c.created_at || ''
        ])
      ];

    case 'cobros':
      return [
        ['OBV', 'Empresa', 'Facturación', 'Cobrado', 'Pendiente', 'Estado Cobro', 'Días Retraso', 'Fecha Esperada', 'Responsable', 'Email', 'Teléfono'],
        ...dataArray.map(c => [
          c.obv_titulo || '',
          c.empresa || '',
          c.facturacion || 0,
          c.cobrado || 0,
          c.pendiente_cobro || 0,
          c.cobro_estado || '',
          c.cobro_dias_retraso || 0,
          c.cobro_fecha_esperada || '',
          c.responsable_nombre || '',
          c.email_contacto || '',
          c.telefono_contacto || ''
        ])
      ];

    case 'productos':
      return [
        ['Producto', 'Nº Ventas', 'Facturación Total', 'Margen Total', '% Margen'],
        ...dataArray.map(p => [
          p.producto || '',
          p.num_ventas || 0,
          p.facturacion_total || 0,
          p.margen_total || 0,
          p.porcentaje_margen || 0
        ])
      ];

    case 'clientes':
      return [
        ['Cliente', 'Nº Compras', 'Valor Total', 'Última Compra'],
        ...dataArray.map(c => [
          c.empresa || '',
          c.num_compras || 0,
          c.valor_total_facturado || 0,
          c.ultima_compra || ''
        ])
      ];

    case 'proyectos':
      return [
        ['Proyecto', 'Facturación', 'Margen', '% Margen', 'Costes', '% Costes/Facturación', 'OBVs', 'Leads'],
        ...dataArray.map(p => [
          p.nombre || '',
          p.facturacion || 0,
          p.margen || 0,
          p.porcentaje_margen || 0,
          p.costes_totales || 0,
          p.porcentaje_costes || 0,
          p.total_obvs || 0,
          p.total_leads || 0
        ])
      ];

    case 'kpis':
      return [
        ['Título', 'Tipo', 'Proyecto', 'Owner', 'Status', 'Valor Objetivo', 'Valor Actual', '% Progreso', 'Creado'],
        ...dataArray.map(k => [
          k.titulo || '',
          k.type || '',
          k.project_nombre || '',
          k.owner_nombre || '',
          k.status || '',
          k.target_value || 0,
          k.current_value || 0,
          k.progress || 0,
          k.created_at || ''
        ])
      ];

    case 'members':
      return [
        ['Nombre', 'Email', 'Rol', 'Proyectos', 'OBVs', 'Facturación', 'Margen', 'KPIs', 'Score'],
        ...dataArray.map(m => [
          m.nombre || '',
          m.email || '',
          m.role || '',
          m.num_proyectos || 0,
          m.total_obvs || 0,
          m.facturacion || 0,
          m.margen || 0,
          m.total_kpis || 0,
          m.score || 0
        ])
      ];

    case 'financiero':
      return [
        ['Proyecto', 'Facturación', 'Costes', 'Margen', '% Margen', 'Costes Materiales', 'Costes Subcontratación', 'Costes Herramientas', 'Costes Marketing'],
        ...dataArray.map(f => [
          f.proyecto_nombre || '',
          f.facturacion || 0,
          f.costes_totales || 0,
          f.margen || 0,
          f.porcentaje_margen || 0,
          f.costes_materiales || 0,
          f.costes_subcontratacion || 0,
          f.costes_herramientas || 0,
          f.costes_marketing || 0
        ])
      ];

    default: {
      if (dataArray.length === 0) return [['No hay datos']];
      const headers = Object.keys(dataArray[0]);
      return [
        headers,
        ...dataArray.map(item => headers.map(h => item[h] ?? ''))
      ];
    }
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
