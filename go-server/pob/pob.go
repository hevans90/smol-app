// Package pob computes character stats by running a character's public API
// data through headless Path of Building (see extract-stats.lua, which is
// embedded in the binary; ../../headless-pob builds a standalone image with
// the same script for manual testing).
package pob

import (
	"bytes"
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
)

//go:embed extract-stats.lua
var extractStatsScript []byte

// Stats mirrors the JSON printed by extract-stats.lua. Stat key names drift
// between PoB versions; re-verify with --dump after bumping POB_VERSION.
type Stats struct {
	Character struct {
		Name   string `json:"name"`
		Class  string `json:"class"`
		Level  int    `json:"level"`
		League string `json:"league"`
	} `json:"character"`
	MainSkill              string  `json:"mainSkill"`
	CombinedDPS            float64 `json:"combinedDPS"`
	TotalDPS               float64 `json:"totalDPS"`
	FullDPS                float64 `json:"fullDPS"`
	TotalDotDPS            float64 `json:"totalDotDPS"`
	Life                   float64 `json:"life"`
	LifeUnreserved         float64 `json:"lifeUnreserved"`
	EnergyShield           float64 `json:"energyShield"`
	Mana                   float64 `json:"mana"`
	Ward                   float64 `json:"ward"`
	TotalEHP               float64 `json:"totalEHP"`
	Armour                 float64 `json:"armour"`
	Evasion                float64 `json:"evasion"`
	BlockChance            float64 `json:"blockChance"`
	SpellBlockChance       float64 `json:"spellBlockChance"`
	SpellSuppressionChance float64 `json:"spellSuppressionChance"`
	FireResist             float64 `json:"fireResist"`
	ColdResist             float64 `json:"coldResist"`
	LightningResist        float64 `json:"lightningResist"`
	ChaosResist            float64 `json:"chaosResist"`
	CritChance             float64 `json:"critChance"`
	CritMultiplier         float64 `json:"critMultiplier"`
	AttackSpeed            float64 `json:"attackSpeed"`
	Error                  string  `json:"error"`
}

// Runner executes one headless PoB process per Compute call.
type Runner struct {
	// Command, when non-empty, is run as-is with the combined JSON on stdin
	// (e.g. "docker run -i --rm headless-pob" for local dev).
	Command []string
	// LuaJIT and PoBSrcDir are used when Command is empty: LuaJIT runs the
	// embedded extract-stats.lua from PoBSrcDir (the PoB clone's src/ dir,
	// which is also where LUA_PATH must point for the runtime modules).
	LuaJIT    string
	PoBSrcDir string

	scriptOnce sync.Once
	scriptPath string
	scriptErr  error
}

// NewRunnerFromEnv builds a Runner from POB_COMMAND (full command override)
// or POB_LUAJIT + POB_SRC_DIR (defaults: "luajit" and "/app/pob/src").
func NewRunnerFromEnv() *Runner {
	if command := os.Getenv("POB_COMMAND"); command != "" {
		return &Runner{Command: strings.Fields(command)}
	}
	luajit := os.Getenv("POB_LUAJIT")
	if luajit == "" {
		luajit = "luajit"
	}
	srcDir := os.Getenv("POB_SRC_DIR")
	if srcDir == "" {
		srcDir = "/app/pob/src"
	}
	return &Runner{LuaJIT: luajit, PoBSrcDir: srcDir}
}

// Available reports whether this environment can run PoB at all, so local
// setups without a PoB clone or the docker image skip the stats sweep.
func (r *Runner) Available() bool {
	if len(r.Command) > 0 {
		_, err := exec.LookPath(r.Command[0])
		return err == nil
	}
	if _, err := exec.LookPath(r.LuaJIT); err != nil {
		return false
	}
	_, err := os.Stat(filepath.Join(r.PoBSrcDir, "HeadlessWrapper.lua"))
	return err == nil
}

func (r *Runner) ensureScript() (string, error) {
	r.scriptOnce.Do(func() {
		f, err := os.CreateTemp("", "extract-stats-*.lua")
		if err != nil {
			r.scriptErr = err
			return
		}
		if _, err := f.Write(extractStatsScript); err != nil {
			f.Close()
			r.scriptErr = err
			return
		}
		r.scriptErr = f.Close()
		r.scriptPath = f.Name()
	})
	return r.scriptPath, r.scriptErr
}

// Compute runs headless PoB over the two raw character-window payloads and
// returns the calculated stats. It is safe for concurrent use, though each
// call spawns its own ~250MB PoB process, so callers should run sequentially.
func (r *Runner) Compute(ctx context.Context, items, passives json.RawMessage) (*Stats, error) {
	payload, err := json.Marshal(map[string]json.RawMessage{
		"items":    items,
		"passives": passives,
	})
	if err != nil {
		return nil, err
	}

	var cmd *exec.Cmd
	if len(r.Command) > 0 {
		cmd = exec.CommandContext(ctx, r.Command[0], r.Command[1:]...)
	} else {
		scriptPath, err := r.ensureScript()
		if err != nil {
			return nil, fmt.Errorf("could not materialise extract-stats.lua: %w", err)
		}
		cmd = exec.CommandContext(ctx, r.LuaJIT, scriptPath, "--stdin")
		cmd.Dir = r.PoBSrcDir
	}

	var stdout, stderr bytes.Buffer
	cmd.Stdin = bytes.NewReader(payload)
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	runErr := cmd.Run()

	// stdout is one JSON document even on failure ({"error": "..."}, exit 1).
	var stats Stats
	if err := json.Unmarshal(stdout.Bytes(), &stats); err != nil {
		if runErr != nil {
			return nil, fmt.Errorf("pob process failed: %w (stderr: %s)", runErr, lastLine(stderr.Bytes()))
		}
		return nil, fmt.Errorf("pob printed invalid JSON: %w", err)
	}
	if stats.Error != "" {
		return nil, fmt.Errorf("pob: %s", stats.Error)
	}
	if runErr != nil {
		return nil, fmt.Errorf("pob process failed: %w (stderr: %s)", runErr, lastLine(stderr.Bytes()))
	}
	return &stats, nil
}

func lastLine(output []byte) string {
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	if len(lines) == 0 {
		return ""
	}
	return lines[len(lines)-1]
}
