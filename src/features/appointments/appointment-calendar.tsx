"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { rescheduleAppointment } from "./actions";
type Event = { id: string; title: string; start: string; end: string; status: string; revision: number };
export function AppointmentCalendar({ events, date }: { events: Event[]; date: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (value: Date) => router.push(`/appointments?date=${value.toISOString().slice(0, 10)}`);
  return (
    <>
      <div className="hidden rounded-lg border bg-card p-2 md:block">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialDate={date}
          initialView="timeGridWeek"
          headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridDay,timeGridWeek" }}
          buttonText={{ today: "Current day", timeGridDay: "Day", timeGridWeek: "Week" }}
          timeZone="Asia/Kabul"
          editable={!pending}
          eventStartEditable
          eventDurationEditable
          events={events.map((event) => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            classNames: [`appointment-${event.status}`],
            extendedProps: { revision: event.revision },
          }))}
          datesSet={(info) => go(info.start)}
          eventDrop={(info) =>
            startTransition(async () => {
              const result = await rescheduleAppointment(
                info.event.id,
                info.event.start?.toISOString() ?? "",
                info.event.end?.toISOString() ?? "",
                Number(info.event.extendedProps.revision),
              );
              if (result.error) {
                info.revert();
                alert(result.error);
              } else router.refresh();
            })
          }
          eventResize={(info) =>
            startTransition(async () => {
              const result = await rescheduleAppointment(
                info.event.id,
                info.event.start?.toISOString() ?? "",
                info.event.end?.toISOString() ?? "",
                Number(info.event.extendedProps.revision),
              );
              if (result.error) {
                info.revert();
                alert(result.error);
              } else router.refresh();
            })
          }
          eventClick={(info) => router.push(`/appointments/${info.event.id}`)}
        />
      </div>
      <div className="space-y-3 md:hidden">
        {events.length ? (
          events.map((event) => (
            <button
              className="w-full rounded-lg border bg-card p-4 text-left"
              key={event.id}
              onClick={() => router.push(`/appointments/${event.id}`)}
            >
              <p className="font-medium">{event.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(event.start).toLocaleString("en-US", { timeZone: "Asia/Kabul" })} ·{" "}
                {event.status.replaceAll("_", " ")}
              </p>
            </button>
          ))
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No appointments in this period.
          </p>
        )}
      </div>
    </>
  );
}
