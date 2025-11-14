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

create or replace function user_analytics_aggregate_period(
    p_start timestamptz,
    p_interval interval
)
returns table (
    user_id int,
    window_start timestamptz,
    window_end timestamptz,
    lang_durations jsonb,
    machine_durations jsonb,
    editor_durations jsonb,
    project_durations jsonb,
    activity_durations jsonb
) language sql as $$
    select
        d.user_id,
        min(d.window_start) as window_start,
        max(d.window_end) as window_end,
        jsonb_sum_aggregate(array_agg(d.lang_durations)) as lang_durations,
        jsonb_sum_aggregate(array_agg(d.machine_durations)) as machine_durations,
        jsonb_sum_aggregate(array_agg(d.editor_durations)) as editor_durations,
        jsonb_sum_aggregate(array_agg(d.project_durations)) as project_durations,
        jsonb_sum_aggregate(array_agg(d.activity_durations)) as activity_durations
    from user_stats_aggregate_daily d
    where d.window_start >= p_start
      and d.window_start < p_start + p_interval
    group by d.user_id;
$$;

create or replace function user_project_analytics_aggregate_period(
    p_start timestamptz,
    p_interval interval
)
returns table (
    user_id int,
    project_path varchar,
    window_start timestamptz,
    window_end timestamptz,
    lang_durations jsonb,
    machine_durations jsonb,
    editor_durations jsonb,
    activity_durations jsonb,
    files_durations jsonb
) language sql as $$
    select
        d.user_id,
        d.project_path,
        min(d.window_start) as window_start,
        max(d.window_end) as window_end,
        jsonb_sum_aggregate(array_agg(d.lang_durations)) as lang_durations,
        jsonb_sum_aggregate(array_agg(d.machine_durations)) as machine_durations,
        jsonb_sum_aggregate(array_agg(d.editor_durations)) as editor_durations,
        jsonb_sum_aggregate(array_agg(d.activity_durations)) as activity_durations,
        jsonb_sum_aggregate(array_agg(d.files_durations)) as files_durations
    from user_project_stats_aggregate_daily d
    where d.window_start >= p_start
      and d.window_start < p_start + p_interval
    group by d.user_id, d.project_path;
$$;
