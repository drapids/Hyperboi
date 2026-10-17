local json = require("json")

local M = {}

local ORIGIN = { X = 0, Y = 0, Z = 300000 }
local CAPSULE = { 38, 38, 90 }
local BATCH = 40

local ctx
local cur = nil
local pending = nil
local lastStatus = "none"
local lastError = ""
local hookOk = false

local D = math.pi / 180

local function safe(f, ...)
    local ok, a, b = pcall(f, ...)
    if ok then return a, b end
    return nil
end

local function valid(o)
    return o ~= nil and safe(function() return o:IsValid() end) == true
end

local function log(msg)
    local f = io.open(ctx.bridgeDir .. "/maps_log.txt", "a")
    if f then
        f:write(os.date("%H:%M:%S ") .. tostring(msg) .. "\n")
        f:close()
    end
end

local function axesFromRot(r)
    local p, y, ro = (r[1] or 0) * D, (r[2] or 0) * D, (r[3] or 0) * D
    local SP, CP, SY, CY, SR, CR = math.sin(p), math.cos(p), math.sin(y), math.cos(y), math.sin(ro), math.cos(ro)
    return {
        { CP * CY, CP * SY, SP },
        { SR * SP * CY - CR * SY, SR * SP * SY + CR * CY, -SR * CP },
        { -(CR * SP * CY + SR * SY), CY * SR - CR * SP * SY, CR * CP },
    }
end

local function rotFromAxes(A)
    local X, Y, Z = A[1], A[2], A[3]
    local pitch = math.atan(X[3], math.sqrt(X[1] * X[1] + X[2] * X[2]))
    local yaw = math.atan(X[2], X[1])
    local sy = { -math.sin(yaw), math.cos(yaw), 0 }
    local roll = math.atan(Z[1] * sy[1] + Z[2] * sy[2] + Z[3] * sy[3], Y[1] * sy[1] + Y[2] * sy[2] + Y[3] * sy[3])
    return { Pitch = pitch / D, Yaw = yaw / D, Roll = roll / D }
end

local function rotateVec(v, axis, ang)
    local l = math.sqrt(axis[1] ^ 2 + axis[2] ^ 2 + axis[3] ^ 2)
    if l == 0 then return v end
    local kx, ky, kz = axis[1] / l, axis[2] / l, axis[3] / l
    local c, s = math.cos(ang), math.sin(ang)
    local dot = kx * v[1] + ky * v[2] + kz * v[3]
    local cx, cy, cz = ky * v[3] - kz * v[2], kz * v[1] - kx * v[3], kx * v[2] - ky * v[1]
    return { v[1] * c + cx * s + kx * dot * (1 - c), v[2] * c + cy * s + ky * dot * (1 - c), v[3] * c + cz * s + kz * dot * (1 - c) }
end

local function smooth(f) return f * f * (3 - 2 * f) end

local function moveOffset(m, t)
    local pts = {}
    for i, p in ipairs(m.points) do pts[i] = p end
    if m.mode == "loop" then pts[#pts + 1] = m.points[1] end
    local n = #pts - 1
    if n < 1 then return { 0, 0, 0 } end
    local u = math.max(0, t - (m.delay or 0)) / m.duration
    if m.mode == "pingpong" then
        u = u % 2
        if u > 1 then u = 2 - u end
    elseif m.mode == "loop" then
        u = u % 1
    else
        u = math.min(1, u)
    end
    local x = u * n
    local i = math.min(n - 1, math.floor(x))
    local f = x - i
    if m.ease == "smooth" then f = smooth(f) end
    local a, b = pts[i + 1], pts[i + 2]
    return { a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f }
end

local function evalAnim(anim, t, pos, axes)
    local visible = true
    local rots = {}
    if anim.spin then rots[#rots + 1] = { anim.spin.axis, anim.spin.speed * t * D } end
    if anim.swing then rots[#rots + 1] = { anim.swing.axis, anim.swing.angle * math.sin(2 * math.pi * t / anim.swing.period) * D } end
    if #rots > 0 then
        local pv = anim.pivot
        local rel = { pos[1] - pv[1], pos[2] - pv[2], pos[3] - pv[3] }
        local ax = { axes[1], axes[2], axes[3] }
        for _, r in ipairs(rots) do
            rel = rotateVec(rel, r[1], r[2])
            ax = { rotateVec(ax[1], r[1], r[2]), rotateVec(ax[2], r[1], r[2]), rotateVec(ax[3], r[1], r[2]) }
        end
        pos = { pv[1] + rel[1], pv[2] + rel[2], pv[3] + rel[3] }
        axes = ax
    end
    if anim.move then
        local o = moveOffset(anim.move, t)
        pos = { pos[1] + o[1], pos[2] + o[2], pos[3] + o[3] }
    end
    if anim.blink and t > 0 then
        local c = anim.blink.on + anim.blink.off
        if c > 0 then visible = ((t + anim.blink.offset) % c) < anim.blink.on end
    end
    return pos, axes, visible
end

local function W(p)
    return { X = ORIGIN.X + p[1], Y = ORIGIN.Y + p[2], Z = ORIGIN.Z + p[3] }
end

local function hexColor(h, linear)
    h = tostring(h or "#ffffff"):gsub("#", "")
    local r = tonumber(h:sub(1, 2), 16) or 255
    local g = tonumber(h:sub(3, 4), 16) or 255
    local b = tonumber(h:sub(5, 6), 16) or 255
    if linear then
        local function lin(c)
            c = c / 255
            return c <= 0.04045 and c / 12.92 or ((c + 0.055) / 1.055) ^ 2.4
        end
        return { R = lin(r), G = lin(g), B = lin(b), A = 1 }
    end
    return { R = r, G = g, B = b, A = 255 }
end

local assetCache = {}
local function asset(path, suffix)
    local key = path .. (suffix or "")
    if assetCache[key] ~= nil then return assetCache[key] or nil end
    local base = path:match("([^/]+)$")
    local full = path .. "." .. base .. (suffix or "")
    local o = StaticFindObject(full)
    if not valid(o) then
        safe(function() LoadAsset(path) end)
        o = StaticFindObject(full)
    end
    if not valid(o) then
        log("missing asset " .. full)
        assetCache[key] = false
        return nil
    end
    assetCache[key] = o
    return o
end

local CLASSES = {}
local function cls(path)
    if CLASSES[path] == nil then
        local c = StaticFindObject(path)
        CLASSES[path] = valid(c) and c or false
    end
    return CLASSES[path] or nil
end

local SHAPES = { cube = "/Engine/BasicShapes/Cube", cylinder = "/Engine/BasicShapes/Cylinder", sphere = "/Engine/BasicShapes/Sphere", cone = "/Engine/BasicShapes/Cone" }

local function spawnActor(world, class, loc, rot)
    local a = safe(function() return world:SpawnActor(class, loc, rot) end)
    if valid(a) then return a end
    local gs = StaticFindObject("/Script/Engine.Default__GameplayStatics")
    return nil
end

local function meshComp(actor)
    local c = safe(function() return actor.StaticMeshComponent end)
    if valid(c) then return c end
    return nil
end

local function applyLook(actor, comp, part)
    if part.hidden then safe(function() actor:SetActorHiddenInGame(true) end) end
    if part.collide == false then safe(function() actor:SetActorEnableCollision(false) end) end
    if part.ice and valid(comp) then
        local pm = asset("/Game/Blueprints/PhysMat_Ice1")
        if pm then safe(function() comp:SetPhysMaterialOverride(pm) end) end
    end
end

local function spawnPart(world, part)
    local loc = W(part.pos)
    local r = part.rot or { 0, 0, 0 }
    local rot = { Pitch = r[1], Yaw = r[2], Roll = r[3] }
    local s = part.scale or { 1, 1, 1 }
    local actor
    if part.kind == "shape" or part.kind == "mesh" then
        local smaClass = cls("/Script/Engine.StaticMeshActor")
        local mesh = part.kind == "shape" and asset(SHAPES[part.shape] or SHAPES.cube) or asset(part.path)
        if not smaClass or not mesh then return nil end
        actor = spawnActor(world, smaClass, loc, rot)
        if not actor then return nil end
        local comp = meshComp(actor)
        if comp then
            safe(function() comp:SetMobility(2) end)
            safe(function() comp:SetStaticMesh(mesh) end)
            if part.kind == "shape" and part.color then
                local base = asset("/Engine/BasicShapes/BasicShapeMaterial")
                if base then
                    local mi = safe(function() return comp:CreateDynamicMaterialInstance(0, base, FName("None")) end)
                    if valid(mi) then safe(function() mi:SetVectorParameterValue(FName("Color"), hexColor(part.color, true)) end) end
                end
            end
        end
        applyLook(actor, comp, part)
    elseif part.kind == "bp" then
        local c = asset(part.path, "_C")
        if not c then return nil end
        actor = spawnActor(world, c, loc, rot)
        if not actor then return nil end
        applyLook(actor, nil, part)
    elseif part.kind == "skel" then
        local c = cls("/Script/Engine.SkeletalMeshActor")
        local mesh = asset(part.path)
        if not c or not mesh then return nil end
        actor = spawnActor(world, c, loc, rot)
        if not actor then return nil end
        local comp = safe(function() return actor.SkeletalMeshComponent end)
        if valid(comp) then
            safe(function() comp:SetMobility(2) end)
            if not safe(function() comp:SetSkeletalMeshAsset(mesh) return true end) then
                safe(function() comp:SetSkeletalMesh(mesh, true) end)
            end
        end
    elseif part.kind == "text" then
        local c = cls("/Script/Engine.TextRenderActor")
        if not c then return nil end
        actor = spawnActor(world, c, loc, rot)
        if not actor then return nil end
        local comp = safe(function() return actor.TextRender end)
        if valid(comp) then
            safe(function() comp:SetMobility(2) end)
            safe(function() comp:K2_SetText(FText(part.text or "")) end)
            safe(function() comp:SetWorldSize(part.size or 100) end)
            safe(function() comp:SetHorizontalAlignment(1) end)
            safe(function() comp:SetVerticalAlignment(1) end)
            safe(function() comp:SetTextRenderColor(hexColor(part.color, false)) end)
        end
        s = { 1, 1, 1 }
    elseif part.kind == "light" then
        local c = cls("/Script/Engine.PointLight")
        if not c then return nil end
        actor = spawnActor(world, c, loc, rot)
        if not actor then return nil end
        local comp = safe(function() return actor.PointLightComponent end)
        if valid(comp) then
            safe(function() comp:SetMobility(2) end)
            safe(function() comp:SetIntensity(part.intensity or 8000) end)
            safe(function() comp:SetAttenuationRadius(part.radius or 2000) end)
            safe(function() comp:SetLightColor(hexColor(part.color, true), true) end)
        end
        s = { 1, 1, 1 }
    end
    if not actor then return nil end
    safe(function() actor:SetActorScale3D({ X = s[1], Y = s[2], Z = s[3] }) end)
    return actor
end

local function readIndex()
    local list = {}
    local f = io.open(ctx.modDir .. "/maps/index.txt", "r")
    if not f then return list end
    for line in f:lines() do
        local file, name, author, diff = line:match("^(.-)|(.-)|(.-)|(.-)$")
        if file and file ~= "" then list[#list + 1] = { file = file, name = name, author = author, difficulty = diff } end
    end
    f:close()
    return list
end
M.readIndex = readIndex

local function now(world)
    local gs = StaticFindObject("/Script/Engine.Default__GameplayStatics")
    local t = gs and safe(function() return gs:GetTimeSeconds(world) end)
    return t or os.clock()
end

local function charPos(ch)
    local v = safe(function() return ch:K2_GetActorLocation() end)
    if not v then return nil end
    return { v.X - ORIGIN.X, v.Y - ORIGIN.Y, v.Z - ORIGIN.Z }
end

local function teleport(ch, pos, yaw, keepVel)
    local cmc = ctx.getCmc()
    safe(function() ch:K2_SetActorLocation(W({ pos[1], pos[2], pos[3] + CAPSULE[3] + 10 }), false, {}, true) end)
    if not keepVel and valid(cmc) then safe(function() cmc.Velocity = { X = 0, Y = 0, Z = 0 } end) end
    if yaw then
        local ctrl = safe(function() return ch.Controller end)
        if valid(ctrl) then safe(function() ctrl:SetControlRotation({ Pitch = -10, Yaw = yaw, Roll = 0 }) end) end
    end
end

local function setMsg(text)
    if cur then
        cur.msg = text
        cur.msgAt = os.clock()
    end
end

local function restoreMovement()
    if not cur or not cur.orig then return end
    local cmc = ctx.getCmc()
    if valid(cmc) then
        for k, v in pairs(cur.orig) do safe(function() cmc[k] = v end) end
    end
    local ws = FindAllOf("WorldSettings")
    if ws then for _, w in ipairs(ws) do safe(function() w.TimeDilation = 1 end) end end
end

local function applyRules()
    local cmc = ctx.getCmc()
    if not valid(cmc) then return end
    cur.orig = {}
    for _, k in ipairs({ "GravityScale", "MaxWalkSpeed", "JumpZVelocity", "MaxAcceleration" }) do
        cur.orig[k] = safe(function() return cmc[k] end)
    end
    local r = cur.rules
    cur.baseGravity = (cur.orig.GravityScale or 1) * (r.gravity or 1)
    safe(function() cmc.GravityScale = cur.baseGravity end)
    if r.speed and r.speed ~= 1 and cur.orig.MaxWalkSpeed then
        safe(function() cmc.MaxWalkSpeed = cur.orig.MaxWalkSpeed * r.speed end)
        safe(function() cmc.MaxAcceleration = (cur.orig.MaxAcceleration or 2048) * r.speed end)
    end
    if r.jump and r.jump ~= 1 and cur.orig.JumpZVelocity then safe(function() cmc.JumpZVelocity = cur.orig.JumpZVelocity * r.jump end) end
end

function M.unload(silent)
    if not cur then return end
    for _, sp in ipairs(cur.spawned) do
        if valid(sp.actor) then safe(function() sp.actor:K2_DestroyActor() end) end
    end
    restoreMovement()
    ctx.setKillboxes(false)
    local ch = ctx.getChar()
    if valid(ch) and cur.returnTo and cur.world == ctx.worldName() then
        safe(function() ch:K2_SetActorLocation(cur.returnTo, false, {}, true) end)
        local cmc = ctx.getCmc()
        if valid(cmc) then safe(function() cmc.Velocity = { X = 0, Y = 0, Z = 0 } end) end
    end
    if not silent then log("unloaded " .. tostring(cur.name)) end
    cur = nil
    lastStatus = "none"
end

function M.load(file)
    M.unload(true)
    lastError = ""
    local path = ctx.modDir .. "/maps/" .. file
    local f = io.open(path, "r")
    if not f then
        lastError = "Couldn't open " .. file
        lastStatus = "error"
        return false
    end
    local text = f:read("*a")
    f:close()
    local data, err = json.decode(text)
    if not data or data.format ~= "builderballin" then
        lastError = "That isn't a Builderballin map (" .. tostring(err or "wrong format") .. ")"
        lastStatus = "error"
        return false
    end
    if not data.build then
        lastError = "Export the map again from Builderballin, it's missing its build data"
        lastStatus = "error"
        return false
    end
    local ch = ctx.getChar()
    if not valid(ch) then
        pending = file
        lastStatus = "waiting"
        return true
    end
    local world = safe(function() return ch:GetWorld() end)
    local b = data.build
    local here = safe(function() return ch:K2_GetActorLocation() end)
    cur = {
        file = file,
        name = (data.meta and data.meta.name) or file,
        meta = data.meta or {},
        rules = data.rules or {},
        build = b,
        world = ctx.worldName(),
        worldObj = world,
        returnTo = here and { X = here.X, Y = here.Y, Z = here.Z } or nil,
        queue = {},
        spawned = {},
        animated = {},
        zones = {},
        spawn = b.spawn or { pos = { 0, 0, 0 }, yaw = 0 },
        respawnAt = nil,
        cps = {},
        cpTotal = b.checkpoints or 0,
        deaths = 0,
        runStart = nil,
        runTime = 0,
        finished = nil,
        best = nil,
        msg = nil,
        t0 = now(world),
        triggers = {},
    }
    for _, p in ipairs(b.parts or {}) do cur.queue[#cur.queue + 1] = p end
    for _, z in ipairs(b.zones or {}) do
        z.axes = axesFromRot(z.rot or { 0, 0, 0 })
        z.inside = false
        z.cur = z.pos
        z.curAxes = z.axes
        cur.zones[#cur.zones + 1] = z
    end
    lastStatus = "loading"
    ctx.setKillboxes(true)
    log("loading " .. cur.name .. " with " .. #cur.queue .. " parts")
    return true
end

function M.restart()
    if not cur then return end
    local ch = ctx.getChar()
    if not valid(ch) then return end
    cur.cps = {}
    cur.respawnAt = nil
    cur.runStart = nil
    cur.runTime = 0
    cur.finished = nil
    cur.armed = true
    for _, z in ipairs(cur.zones) do z.fired = false end
    cur.triggers = {}
    cur.t0 = now(cur.worldObj)
    teleport(ch, cur.spawn.pos, cur.spawn.yaw, false)
end

local function respawn(ch, reason)
    cur.deaths = cur.deaths + 1
    local at = cur.respawnAt or { pos = cur.spawn.pos, yaw = cur.spawn.yaw }
    teleport(ch, at.pos, at.yaw, false)
    if not cur.respawnAt then
        cur.runStart = nil
        cur.runTime = 0
        cur.armed = true
    end
    local cmc = ctx.getCmc()
    if valid(cmc) and cur.baseGravity then safe(function() cmc.GravityScale = cur.baseGravity end) end
    for _, z in ipairs(cur.zones) do z.inside = false end
end

local function inZone(z, p)
    local d = { p[1] - z.cur[1], p[2] - z.cur[2], p[3] - z.cur[3] }
    local A = z.curAxes
    for k = 1, 3 do
        local l = d[1] * A[k][1] + d[2] * A[k][2] + d[3] * A[k][3]
        if math.abs(l) > z.ext[k] + CAPSULE[k] * 0.5 then return false end
    end
    return true
end

local function launch(ch, v, xy, z)
    safe(function() ch:LaunchCharacter({ X = v[1], Y = v[2], Z = v[3] }, xy, z) end)
end

local function zoneEnter(z, ch, cmc)
    local t = z.type
    local P = z.params or {}
    if t == "kill" then
        respawn(ch, "kill")
    elseif t == "checkpoint" then
        if not cur.cps[z.id] then
            cur.cps[z.id] = true
            local n = 0
            for _ in pairs(cur.cps) do n = n + 1 end
            setMsg("Checkpoint " .. n .. "/" .. cur.cpTotal)
        end
        cur.respawnAt = { pos = { z.cur[1], z.cur[2], z.cur[3] - z.ext[3] }, yaw = (z.rot and z.rot[2]) or cur.spawn.yaw }
    elseif t == "finish" then
        local n = 0
        for _ in pairs(cur.cps) do n = n + 1 end
        if cur.rules.needCheckpoints and n < cur.cpTotal then
            setMsg("Touch every checkpoint first (" .. n .. "/" .. cur.cpTotal .. ")")
        elseif cur.runStart and not cur.finished then
            cur.finished = now(cur.worldObj) - cur.runStart
            cur.runTime = cur.finished
            if not cur.best or cur.finished < cur.best then cur.best = cur.finished end
            setMsg(("Finished in %.2f s"):format(cur.finished))
            log(("finish %s %.3f"):format(cur.name, cur.finished))
        end
    elseif t == "bounce" then
        launch(ch, { 0, 0, P.power or 2200 }, not P.keep, true)
    elseif t == "boost" then
        local f = z.curAxes[1]
        local pw = P.power or 3500
        launch(ch, { f[1] * pw, f[2] * pw, (P.lift or 0) + f[3] * pw }, true, (P.lift or 0) > 0)
    elseif t == "speed" then
        if valid(cmc) then
            local v = safe(function() return cmc.Velocity end)
            if v then
                local m = P.mult or 1.5
                safe(function() cmc.Velocity = { X = v.X * m, Y = v.Y * m, Z = v.Z } end)
            end
        end
    elseif t == "gravity" then
        if valid(cmc) then safe(function() cmc.GravityScale = (cur.baseGravity or 1) * (P.scale or 0.3) end) end
    elseif t == "slowmo" then
        local ws = FindAllOf("WorldSettings")
        if ws then for _, w in ipairs(ws) do safe(function() w.TimeDilation = P.speed or 0.4 end) end end
    elseif t == "teleport" then
        if z.to then
            local v = valid(cmc) and safe(function() return cmc.Velocity end)
            teleport(ch, z.to.pos, z.to.yaw, P.keep)
            if P.keep and v then
                local sp = math.sqrt(v.X * v.X + v.Y * v.Y)
                local yaw = (z.to.yaw or 0) * D
                safe(function() cmc.Velocity = { X = math.cos(yaw) * sp, Y = math.sin(yaw) * sp, Z = v.Z } end)
            end
        end
    elseif t == "trigger" then
        local chn = tostring(P.channel or "A")
        if not (P.once and z.fired) then
            z.fired = true
            cur.triggers[chn] = now(cur.worldObj) - cur.t0
        end
    elseif t == "message" then
        setMsg(P.text or "")
    end
end

local function zoneExit(z, ch, cmc)
    if z.type == "gravity" then
        if valid(cmc) and cur.baseGravity then safe(function() cmc.GravityScale = cur.baseGravity end) end
    elseif z.type == "slowmo" then
        local ws = FindAllOf("WorldSettings")
        if ws then for _, w in ipairs(ws) do safe(function() w.TimeDilation = 1 end) end end
    end
end

local function animTime(anim, t)
    if anim.start == "trigger" then
        local at = cur.triggers[tostring(anim.channel or "A")]
        if not at then return 0 end
        return math.max(0, t - at)
    end
    return t
end

local function spawnBatch(world)
    local n = 0
    while #cur.queue > 0 and n < BATCH do
        local part = table.remove(cur.queue, 1)
        local actor = spawnPart(world, part)
        if actor then
            local sp = { actor = actor, part = part, axes = axesFromRot(part.rot or { 0, 0, 0 }) }
            cur.spawned[#cur.spawned + 1] = sp
            if part.anim then cur.animated[#cur.animated + 1] = sp end
        else
            cur.failed = (cur.failed or 0) + 1
        end
        n = n + 1
    end
    if #cur.queue == 0 then
        lastStatus = "loaded"
        log(("loaded %s: %d spawned, %d failed"):format(cur.name, #cur.spawned, cur.failed or 0))
        local ch = ctx.getChar()
        applyRules()
        if valid(ch) then teleport(ch, cur.spawn.pos, cur.spawn.yaw, false) end
        cur.armed = true
        cur.t0 = now(world)
    end
end

function M.tick()
    local ch = ctx.getChar()
    if pending and valid(ch) then
        local f = pending
        pending = nil
        M.load(f)
    end
    if not cur then return end
    if cur.world ~= ctx.worldName() then
        log("world changed, map dropped")
        cur = nil
        lastStatus = "none"
        return
    end
    if not valid(ch) then return end
    local world = cur.worldObj
    if #cur.queue > 0 then
        spawnBatch(world)
        return
    end
    local t = now(world) - cur.t0
    for _, sp in ipairs(cur.animated) do
        local a = sp.part.anim
        local at = animTime(a, t)
        local pos, axes, vis = evalAnim(a, at, sp.part.pos, sp.axes)
        if valid(sp.actor) then
            safe(function() sp.actor:K2_SetActorLocationAndRotation(W(pos), rotFromAxes(axes), false, {}, true) end)
            if a.blink and vis ~= sp.vis then
                sp.vis = vis
                safe(function() sp.actor:SetActorHiddenInGame((not vis) or (sp.part.hidden == true)) end)
                safe(function() sp.actor:SetActorEnableCollision(vis and sp.part.collide ~= false) end)
            end
        end
    end
    local p = charPos(ch)
    if not p then return end
    local cmc = ctx.getCmc()
    if cur.armed and not cur.runStart then
        local v = valid(cmc) and safe(function() return cmc.Velocity end)
        if v and (v.X * v.X + v.Y * v.Y) > 2500 then
            cur.runStart = now(world)
            cur.armed = false
        end
    end
    if cur.runStart and not cur.finished then cur.runTime = now(world) - cur.runStart end
    local lim = cur.rules.timeLimit or 0
    if lim > 0 and cur.runStart and not cur.finished and cur.runTime > lim then
        setMsg("Out of time")
        cur.respawnAt = nil
        M.restart()
        return
    end
    if p[3] < (cur.rules.killHeight or -3000) then
        respawn(ch, "fall")
        return
    end
    for _, z in ipairs(cur.zones) do
        if z.anim then
            local pos, axes = evalAnim(z.anim, animTime(z.anim, t), z.pos, z.axes)
            z.cur, z.curAxes = pos, axes
        end
        local inside = inZone(z, p)
        if inside and not z.inside then
            z.inside = true
            zoneEnter(z, ch, cmc)
            if not cur then return end
        elseif not inside and z.inside then
            z.inside = false
            zoneExit(z, ch, cmc)
        end
        if inside and z.type == "wind" then
            local f = z.curAxes[1]
            local force = (z.params and z.params.force) or 900
            local dt = 1 / 60
            if valid(cmc) then
                local v = safe(function() return cmc.Velocity end)
                if v then safe(function() cmc.Velocity = { X = v.X + f[1] * force * dt, Y = v.Y + f[2] * force * dt, Z = v.Z + f[3] * force * dt } end) end
            end
        end
    end
end

function M.state()
    local L = {}
    if cur then
        local n = 0
        for _ in pairs(cur.cps) do n = n + 1 end
        local status = lastStatus
        if status == "loading" then status = ("loading %d/%d"):format(#cur.spawned, #cur.spawned + #cur.queue) end
        L[#L + 1] = "map_status=" .. status
        L[#L + 1] = "map_file=" .. cur.file
        L[#L + 1] = "map_name=" .. tostring(cur.name):gsub("[\r\n|]", " ")
        L[#L + 1] = ("map_time=%.2f"):format(cur.runTime or 0)
        L[#L + 1] = "map_running=" .. ((cur.runStart and not cur.finished) and "1" or "0")
        if cur.finished then L[#L + 1] = ("map_finish=%.3f"):format(cur.finished) end
        if cur.best then L[#L + 1] = ("map_best=%.3f"):format(cur.best) end
        L[#L + 1] = "map_deaths=" .. cur.deaths
        L[#L + 1] = "map_cp=" .. n .. "/" .. cur.cpTotal
        if cur.failed then L[#L + 1] = "map_failed=" .. cur.failed end
        if cur.msg and os.clock() - (cur.msgAt or 0) < 4 then L[#L + 1] = "map_msg=" .. tostring(cur.msg):gsub("[\r\n]", " ") end
    else
        L[#L + 1] = "map_status=" .. (pending and "waiting" or lastStatus)
        if pending then L[#L + 1] = "map_file=" .. pending end
        if lastError ~= "" then L[#L + 1] = "map_error=" .. lastError end
    end
    return L
end

function M.handle(kind, arg)
    if kind == "map_load" then
        M.load(arg)
    elseif kind == "map_unload" then
        pending = nil
        M.unload(false)
    elseif kind == "map_restart" then
        M.restart()
    elseif kind == "map_respawn" then
        local ch = ctx.getChar()
        if cur and valid(ch) then respawn(ch, "manual") end
    else
        return false
    end
    return true
end

function M.queue(file)
    pending = file
    lastStatus = "waiting"
end

function M.active()
    return cur ~= nil
end

function M.init(c)
    ctx = c
    local f = io.open(ctx.bridgeDir .. "/maps_log.txt", "w")
    if f then f:close() end
    os.remove(ctx.bridgeDir .. "/maps_log.txt")
end

return M
