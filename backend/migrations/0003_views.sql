drop function if exists jsonb_sum_aggregate(rows jsonb[]);
create or replace function jsonb_sum_aggregate(rows jsonb[])
returns jsonb language plpgsql immutable as $$
declare
    result jsonb := '{}';
    r jsonb;
    k text;
    v int;
begin
    if rows is null then
        return result;
    end if;
    foreach r in array rows loop
        for k, v in select key, value::int from jsonb_each(r) loop
            if result ? k then
                result := jsonb_set(result, array[k], ((result ->> k)::int + v)::text::jsonb);
            else
                result := jsonb_set(result, array[k], v::text::jsonb);
            end if;
        end loop;
    end loop;
    return result;
end;
$$;

drop function if exists jsonb_avg_work_per_weekday(work_durations int[], window_starts timestamptz[]);
create or replace function jsonb_avg_work_per_weekday(
    work_durations int[],
    window_starts timestamptz[]
) returns jsonb language sql immutable as $$
    select jsonb_object_agg(
        case extract(dow from ws)::int
            when 0 then 'Sunday'
            when 1 then 'Monday'
            when 2 then 'Tuesday'
            when 3 then 'Wednesday'
            when 4 then 'Thursday'
            when 5 then 'Friday'
            when 6 then 'Saturday'
        end,
        round(avg_dur)::int
    )
    from (
        select
            ws,
            dur,
            avg(dur) over (partition by extract(dow from ws)) as avg_dur
        from unnest(work_durations, window_starts) as t(dur, ws)
    ) s
$$;

drop function if exists user_analytics_aggregate_period(usr_id integer,
    p_start timestamptz,
    p_interval interval);

create or replace function user_analytics_aggregate_period(
    usr_id integer,
    p_start timestamptz,
    p_interval interval
)
returns table (
    window_start timestamptz,
    window_end timestamptz,
    work_duration_ms integer,
    avg_work_duration_ms integer,
    active_days integer,
    lang_durations jsonb,
    machine_durations jsonb,
    editor_durations jsonb,
    project_durations jsonb,
    activity_durations jsonb,
    avg_work_per_weekday jsonb
) language sql as $$
with combined as (
    -- aggregate_daily rows
    select
        d.window_start,
        d.window_end,
        d.lang_durations,
        d.machine_durations,
        d.editor_durations,
        d.project_durations,
        d.activity_durations,
        d.work_duration_ms
    from user_stats_aggregate_daily d
    where d.user_id = usr_id
      and d.window_start >= p_start
      and d.window_start < p_start + p_interval

    union all

    -- rolling_day row
    select
        now() as window_start,
        now() as window_end,
        r.lang_durations,
        r.machine_durations,
        r.editor_durations,
        r.project_durations,
        r.activity_durations,
        r.work_duration_ms
    from user_stats_rolling_day r
    where r.user_id = usr_id
      and p_start + p_interval > now() - interval '24 hours'
)
select
    p_start as window_start,
    p_start + p_interval as window_end,
    coalesce(sum(work_duration_ms), 0) as work_duration_ms,
    coalesce(round(avg(work_duration_ms))::int, 0) as avg_work_duration_ms,
    count(1) as active_days,
    jsonb_sum_aggregate(array_agg(lang_durations)) as lang_durations,
    jsonb_sum_aggregate(array_agg(machine_durations)) as machine_durations,
    jsonb_sum_aggregate(array_agg(editor_durations)) as editor_durations,
    jsonb_sum_aggregate(array_agg(project_durations)) as project_durations,
    jsonb_sum_aggregate(array_agg(activity_durations)) as activity_durations,
    coalesce(
        jsonb_avg_work_per_weekday(array_agg(work_duration_ms), array_agg(window_start)),
        '{}'::jsonb
    ) as avg_work_per_weekday
from combined
$$;

drop function if exists user_project_analytics_aggregate_period(
    usr_id integer,
    project_path varchar,
    p_start timestamptz,
    p_interval interval
);

create or replace function user_project_analytics_aggregate_period(
    usr_id integer,
    project_path varchar,
    p_start timestamptz,
    p_interval interval
)
returns table (
    window_start timestamptz,
    window_end timestamptz,
    work_duration_ms integer,
    active_days integer,
    lang_durations jsonb,
    machine_durations jsonb,
    editor_durations jsonb,
    activity_durations jsonb,
    files_durations jsonb
) language sql as $$
    with combined as (
        -- aggregate_daily rows
        select
            d.window_start,
            d.window_end,
            d.lang_durations,
            d.machine_durations,
            d.editor_durations,
            d.activity_durations,
            d.files_durations,
            d.work_duration_ms work_duration_ms
        from user_project_stats_aggregate_daily d
        where d.user_id = usr_id
          and d.project_path = project_path
          and d.window_start >= p_start
          and d.window_start < p_start + p_interval

        union all

        -- rolling_day row
        select
            now() as window_start,   -- placeholder timestamp
            now() as window_end,     -- placeholder timestamp
            r.lang_durations,
            r.machine_durations,
            r.editor_durations,
            r.activity_durations,
            r.files_durations,
            r.work_duration_ms work_duration_ms
        from user_project_stats_rolling_day r
        where r.user_id = usr_id
          and r.project_path = project_path
          and p_start + p_interval > now() - interval '24 hours'
    )
    select
        p_start as window_start,
        p_start + p_interval as window_end,
        coalesce(sum(work_duration_ms), 0) as work_duration_ms,
        count(1) as active_days,
        jsonb_sum_aggregate(array_agg(lang_durations)) as lang_durations,
        jsonb_sum_aggregate(array_agg(machine_durations)) as machine_durations,
        jsonb_sum_aggregate(array_agg(editor_durations)) as editor_durations,
        jsonb_sum_aggregate(array_agg(activity_durations)) as activity_durations,
        jsonb_sum_aggregate(array_agg(files_durations)) as files_durations
    from combined
$$;
