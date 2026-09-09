"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const MotionNumberFlow = motion.create(NumberFlow);

export interface CountdownLabels {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export interface CountdownProps {
  endDate: Date;
  startDate?: Date;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  separatorClassName?: string;
  separator?: React.ReactNode;
  labels?: CountdownLabels;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const DEFAULT_LABELS: CountdownLabels = {
  days: "Days",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
};

export default function AnimatedNumberCountdown({
  endDate,
  startDate,
  className,
  valueClassName,
  labelClassName,
  separatorClassName,
  separator = ":",
  labels = DEFAULT_LABELS,
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const start = startDate ? new Date(startDate) : new Date();
      const end = new Date(endDate);
      const difference = end.getTime() - start.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate, startDate]);

  const units: { key: keyof TimeLeft; label: string }[] = [
    { key: "days", label: labels.days },
    { key: "hours", label: labels.hours },
    { key: "minutes", label: labels.minutes },
    { key: "seconds", label: labels.seconds },
  ];

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {units.map((unit, i) => (
        <React.Fragment key={unit.key}>
          {i > 0 && (
            <div className={cn("text-2xl", separatorClassName)}>
              {separator}
            </div>
          )}
          <div className="flex flex-col items-center">
            <MotionNumberFlow
              value={timeLeft[unit.key]}
              className={cn(
                "text-5xl tracking-tighter tabular-nums",
                valueClassName,
              )}
              format={{ minimumIntegerDigits: 2 }}
              willChange
            />
            <span className={labelClassName}>{unit.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
