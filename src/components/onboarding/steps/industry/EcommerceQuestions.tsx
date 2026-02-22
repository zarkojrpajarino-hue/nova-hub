/**
 * E-COMMERCE SPECIFIC QUESTIONS
 *
 * Preguntas ultra-específicas para E-commerce / Marketplace
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Store, Package, DollarSign, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { EcommerceAnswers } from '@/types/ultra-onboarding';

interface EcommerceQuestionsProps {
  answers: Partial<EcommerceAnswers>;
  onChange: (answers: Partial<EcommerceAnswers>) => void;
}

export function EcommerceQuestions({ answers, onChange }: EcommerceQuestionsProps) {
  const updateAnswer = <K extends keyof EcommerceAnswers>(
    key: K,
    value: EcommerceAnswers[K]
  ) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🛍️ E-commerce - Preguntas Específicas</h2>
        <p className="text-gray-600">Detalles clave para tu tienda online o marketplace</p>
      </div>

      {/* Business Model */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-green-600" />
            Modelo de Negocio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿Qué modelo usas?</Label>
          <RadioGroup
            value={answers.business_model}
            onValueChange={(value) =>
              updateAnswer('business_model', value as EcommerceAnswers['business_model'])
            }
          >
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="dropshipping" id="dropshipping" className="mt-1" />
              <Label htmlFor="dropshipping" className="flex-1 cursor-pointer">
                <div className="font-semibold">Dropshipping</div>
                <div className="text-sm text-gray-600">Sin inventory, supplier envía directo</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="own_inventory" id="own_inventory" className="mt-1" />
              <Label htmlFor="own_inventory" className="flex-1 cursor-pointer">
                <div className="font-semibold">Inventory Propio</div>
                <div className="text-sm text-gray-600">Compro y almaceno productos</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="print_on_demand" id="print_on_demand" className="mt-1" />
              <Label htmlFor="print_on_demand" className="flex-1 cursor-pointer">
                <div className="font-semibold">Print-on-Demand</div>
                <div className="text-sm text-gray-600">Printful, Printify, etc.</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="marketplace" id="marketplace" className="mt-1" />
              <Label htmlFor="marketplace" className="flex-1 cursor-pointer">
                <div className="font-semibold">Marketplace</div>
                <div className="text-sm text-gray-600">Platform, vendedores externos</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="subscription_box" id="subscription_box" className="mt-1" />
              <Label htmlFor="subscription_box" className="flex-1 cursor-pointer">
                <div className="font-semibold">Subscription Box</div>
                <div className="text-sm text-gray-600">Curated products, recurring</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Product Category */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Categoría de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={answers.product_category || ''}
            onChange={(e) => updateAnswer('product_category', e.target.value)}
            placeholder="Ej: 'Ropa sostenible para millennials' o 'Productos de skincare orgánicos' o 'Tech accessories minimalistas'"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Unit Economics */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Unit Economics
          </CardTitle>
          <CardDescription>Números clave de tu negocio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="aov">AOV - Average Order Value (€)</Label>
              <Input
                id="aov"
                type="number"
                placeholder="50"
                value={answers.average_order_value || ''}
                onChange={(e) => updateAnswer('average_order_value', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="cogs">COGS - Cost of Goods Sold (€)</Label>
              <Input
                id="cogs"
                type="number"
                placeholder="20"
                value={answers.cost_of_goods || ''}
                onChange={(e) => updateAnswer('cost_of_goods', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="shipping_cost">Costo de Envío Promedio (€)</Label>
              <Input
                id="shipping_cost"
                type="number"
                placeholder="5"
                value={answers.shipping_cost || ''}
                onChange={(e) => updateAnswer('shipping_cost', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="target_margin">Margen Objetivo (%)</Label>
              <Input
                id="target_margin"
                type="number"
                placeholder="40"
                value={answers.target_margin || ''}
                onChange={(e) => updateAnswer('target_margin', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>

          {answers.average_order_value && answers.cost_of_goods && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Gross Margin:</strong>{' '}
                {(((answers.average_order_value - answers.cost_of_goods) / answers.average_order_value) * 100).toFixed(1)}%
                {(((answers.average_order_value - answers.cost_of_goods) / answers.average_order_value) * 100) < 40 && (
                  <span className="text-orange-700"> - ⚠️ Bajo para e-commerce saludable (target: 40-60%)</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fulfillment Strategy */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-600" />
            Estrategia de Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿Cómo manejas envíos?</Label>
          <RadioGroup
            value={answers.fulfillment_strategy}
            onValueChange={(value) =>
              updateAnswer('fulfillment_strategy', value as EcommerceAnswers['fulfillment_strategy'])
            }
          >
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="self_fulfill" id="self_fulfill" />
              <Label htmlFor="self_fulfill" className="cursor-pointer">
                Self-fulfillment (yo empaco y envío)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="3pl" id="3pl" />
              <Label htmlFor="3pl" className="cursor-pointer">
                3PL (Third-party logistics)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="fba" id="fba" />
              <Label htmlFor="fba" className="cursor-pointer">
                Amazon FBA
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="supplier_direct" id="supplier_direct" />
              <Label htmlFor="supplier_direct" className="cursor-pointer">
                Supplier envía directo (dropship/POD)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Customer Acquisition */}
      <Card className="border-2 border-pink-200">
        <CardHeader>
          <CardTitle>📢 Customer Acquisition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Principal canal de adquisición</Label>
            <RadioGroup
              value={answers.acquisition_channel}
              onValueChange={(value) =>
                updateAnswer('acquisition_channel', value as EcommerceAnswers['acquisition_channel'])
              }
            >
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="facebook_instagram_ads" id="fb_ig" />
                <Label htmlFor="fb_ig" className="cursor-pointer">Facebook / Instagram Ads</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="google_ads" id="google" />
                <Label htmlFor="google" className="cursor-pointer">Google Ads</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="tiktok" id="tiktok" />
                <Label htmlFor="tiktok" className="cursor-pointer">TikTok Ads</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="seo_organic" id="seo" />
                <Label htmlFor="seo" className="cursor-pointer">SEO / Organic</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="influencers" id="influencers" />
                <Label htmlFor="influencers" className="cursor-pointer">Influencer Marketing</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="amazon" id="amazon" />
                <Label htmlFor="amazon" className="cursor-pointer">Amazon Marketplace</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="target_cac">Target CAC - Customer Acquisition Cost (€)</Label>
            <Input
              id="target_cac"
              type="number"
              placeholder="25"
              value={answers.target_cac || ''}
              onChange={(e) => updateAnswer('target_cac', parseInt(e.target.value) || undefined)}
            />
            <p className="text-xs text-gray-700 mt-1">
              Regla de oro: CAC {'<'} 30% de AOV para primera compra
            </p>
          </div>

          {answers.target_cac && answers.average_order_value && (
            answers.target_cac > (answers.average_order_value * 0.3) && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <strong>⚠️ CAC muy alto:</strong> Tu CAC es {((answers.target_cac / answers.average_order_value) * 100).toFixed(0)}%
                  de tu AOV. Necesitas repeat purchases o aumentar AOV para que sea viable.
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Repeat Purchase */}
      <Card className="border-2 border-teal-200">
        <CardHeader>
          <CardTitle>🔄 Repeat Purchase Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="has_subscription"
                checked={answers.has_subscription_model}
                onCheckedChange={(checked) => updateAnswer('has_subscription_model', !!checked)}
              />
              <Label htmlFor="has_subscription" className="cursor-pointer">
                Modelo de subscripción o membresía
              </Label>
            </div>

            <div>
              <Label htmlFor="expected_ltv">Expected LTV - Lifetime Value (€)</Label>
              <Input
                id="expected_ltv"
                type="number"
                placeholder="150"
                value={answers.expected_ltv || ''}
                onChange={(e) => updateAnswer('expected_ltv', parseInt(e.target.value) || undefined)}
              />
              <p className="text-xs text-gray-700 mt-1">
                Average revenue per customer durante toda su vida
              </p>
            </div>

            {answers.expected_ltv && answers.target_cac && (
              <div className={`p-3 border rounded-lg ${
                (answers.expected_ltv / answers.target_cac) >= 3
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className={`text-sm ${
                  (answers.expected_ltv / answers.target_cac) >= 3
                    ? 'text-green-800'
                    : 'text-orange-800'
                }`}>
                  <strong>LTV:CAC Ratio:</strong> {(answers.expected_ltv / answers.target_cac).toFixed(1)}:1
                  {(answers.expected_ltv / answers.target_cac) >= 3 ? (
                    <span className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Ratio saludable (target: 3:1 mínimo)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      Necesitas mejorar LTV o reducir CAC
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
