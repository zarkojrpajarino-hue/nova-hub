import * as React from 'react';
import { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Database, 
  CheckCircle2, 
  Lightbulb,
  Sparkles,
  Workflow
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { getHelp } from '@/data/helpContent';

export interface HelpContent {
  title: string;
  description: string;
  howItWorks?: string;
  dataSource?: string;
  validation?: string;
  tips?: string[];
}

export interface SectionHelpProps {
  section: string;
  variant?: 'inline' | 'floating' | 'card';
  className?: string;
}

export interface HelpWidgetProps {
  section: string;
  className?: string;
}

const HelpSection = ({ 
  icon: Icon, 
  title, 
  content, 
  iconColor 
}: { 
  icon: React.ElementType; 
  title: string; 
  content: string | string[];
  iconColor: string;
}) => (
  <div className="flex gap-3 py-3 border-b border-border/50 last:border-0">
    <div className={cn("flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center", iconColor)}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-foreground mb-1">{title}</h4>
      {Array.isArray(content) ? (
        <ul className="text-sm text-muted-foreground space-y-1">
          {content.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
      )}
    </div>
  </div>
);

const HelpContentDisplay = ({ content }: { content: HelpContent }) => (
  <div className="space-y-1">
    <HelpSection 
      icon={Info} 
      title="Descripción" 
      content={content.description}
      iconColor="bg-blue-500/10 text-blue-500"
    />
    
    {content.howItWorks && (
      <HelpSection 
        icon={Workflow} 
        title="Cómo funciona" 
        content={content.howItWorks}
        iconColor="bg-purple-500/10 text-purple-500"
      />
    )}
    
    {content.dataSource && (
      <HelpSection 
        icon={Database} 
        title="Origen de datos" 
        content={content.dataSource}
        iconColor="bg-green-500/10 text-green-500"
      />
    )}
    
    {content.validation && (
      <HelpSection 
        icon={CheckCircle2} 
        title="Proceso de validación" 
        content={content.validation}
        iconColor="bg-amber-500/10 text-amber-500"
      />
    )}
    
    {content.tips && content.tips.length > 0 && (
      <HelpSection 
        icon={Lightbulb} 
        title="Consejos útiles" 
        content={content.tips}
        iconColor="bg-cyan-500/10 text-cyan-500"
      />
    )}
  </div>
);

// Inline variant - expandable button
function InlineHelp({ section, className }: SectionHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const content = getHelp(section);
  
  if (!content) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 h-8 text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-xs">¿Cómo funciona?</span>
          {isOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{content.title}</h3>
              <p className="text-xs text-muted-foreground">Guía de uso</p>
            </div>
          </div>
          <HelpContentDisplay content={content} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Floating variant - fixed help button that opens a modal
function FloatingHelp({ section, className }: SectionHelpProps) {
  const content = getHelp(section);
  
  if (!content) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          size="icon"
          variant="outline"
          className={cn(
            "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg",
            "bg-card/80 backdrop-blur-sm border-border/50",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-all duration-300",
            className
          )}
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-lg">{content.title}</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">Guía completa de la sección</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <HelpContentDisplay content={content} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Card variant - collapsible card
function CardHelp({ section, className }: SectionHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const content = getHelp(section);
  
  if (!content) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{content.title}</span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-border/50">
            <HelpContentDisplay content={content} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Main component with variant selection
export function SectionHelp({ section, variant = 'inline', className }: SectionHelpProps) {
  switch (variant) {
    case 'floating':
      return <FloatingHelp section={section} className={className} />;
    case 'card':
      return <CardHelp section={section} className={className} />;
    default:
      return <InlineHelp section={section} className={className} />;
  }
}

// Floating help widget for all sections
export function HelpWidget({ section, className }: HelpWidgetProps) {
  const content = getHelp(section);
  
  if (!content) return null;

  return (
    <TooltipProvider>
      <Dialog>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button 
                className={cn(
                  "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg",
                  "bg-card/90 backdrop-blur-sm border border-border/50",
                  "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                  "flex items-center justify-center transition-all duration-300",
                  className
                )}
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            <p>Ver ayuda</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-lg">{content.title}</span>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">Guía de uso</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <HelpContentDisplay content={content} />
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// Quick inline help icon
export function QuickHelp({ section, className }: HelpWidgetProps) {
  const content = getHelp(section);
  
  if (!content) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button 
            className={cn(
              "inline-flex items-center justify-center w-4 h-4",
              "text-muted-foreground/50 hover:text-muted-foreground",
              "transition-colors cursor-help",
              className
            )}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3"
        >
          <p className="text-xs font-medium mb-1">{content.title}</p>
          <p className="text-xs text-muted-foreground">{content.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
