package pob

import (
	"context"
	"os"
	"testing"
	"time"
)

// Runs the real headless-pob docker image against a captured character
// payload. Requires the image: docker build -f headless-pob/Dockerfile -t headless-pob .
// Skipped unless POB_TEST_DOCKER=1.
func TestComputeWithDocker(t *testing.T) {
	if os.Getenv("POB_TEST_DOCKER") == "" {
		t.Skip("set POB_TEST_DOCKER=1 to run against the headless-pob docker image")
	}

	items, err := os.ReadFile("testdata/items.json")
	if err != nil {
		t.Fatal(err)
	}
	passives, err := os.ReadFile("testdata/passives.json")
	if err != nil {
		t.Fatal(err)
	}

	runner := &Runner{Command: []string{"docker", "run", "-i", "--rm", "headless-pob"}}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	stats, err := runner.Compute(ctx, items, passives)
	if err != nil {
		t.Fatal(err)
	}

	if stats.Character.Name != "VaalMulliSpark" {
		t.Errorf("character name = %q, want VaalMulliSpark", stats.Character.Name)
	}
	if stats.CombinedDPS <= 0 {
		t.Errorf("combinedDPS = %v, want > 0", stats.CombinedDPS)
	}
	if stats.Life <= 0 {
		t.Errorf("life = %v, want > 0", stats.Life)
	}
	if stats.TotalEHP <= 0 {
		t.Errorf("totalEHP = %v, want > 0", stats.TotalEHP)
	}
	if stats.MainSkill == "" {
		t.Error("mainSkill is empty")
	}
	t.Logf("%s (%s): DPS=%.0f EHP=%.0f", stats.Character.Name, stats.MainSkill, stats.CombinedDPS, stats.TotalEHP)
}

// Characters with Timeless Jewels exercise the Inflate/NewFileSearch
// overrides in extract-stats.lua (the jewel LUTs are lazily-inflated zlib
// streams that HeadlessWrapper's stubs cannot load).
func TestComputeTimelessJewelCharacter(t *testing.T) {
	if os.Getenv("POB_TEST_DOCKER") == "" {
		t.Skip("set POB_TEST_DOCKER=1 to run against the headless-pob docker image")
	}

	items, err := os.ReadFile("testdata/items-timeless-jewel.json")
	if err != nil {
		t.Fatal(err)
	}
	passives, err := os.ReadFile("testdata/passives-timeless-jewel.json")
	if err != nil {
		t.Fatal(err)
	}

	runner := &Runner{Command: []string{"docker", "run", "-i", "--rm", "headless-pob"}}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	stats, err := runner.Compute(ctx, items, passives)
	if err != nil {
		t.Fatal(err)
	}
	if stats.CombinedDPS <= 0 {
		t.Errorf("combinedDPS = %v, want > 0", stats.CombinedDPS)
	}
	if stats.Life <= 0 {
		t.Errorf("life = %v, want > 0", stats.Life)
	}
	t.Logf("%s (%s): DPS=%.0f EHP=%.0f", stats.Character.Name, stats.MainSkill, stats.CombinedDPS, stats.TotalEHP)
}

func TestComputeErrorPayload(t *testing.T) {
	if os.Getenv("POB_TEST_DOCKER") == "" {
		t.Skip("set POB_TEST_DOCKER=1 to run against the headless-pob docker image")
	}

	runner := &Runner{Command: []string{"docker", "run", "-i", "--rm", "headless-pob"}}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	_, err := runner.Compute(ctx, []byte(`{}`), []byte(`{}`))
	if err == nil {
		t.Fatal("expected an error for a payload with no character data")
	}
	t.Logf("got expected error: %v", err)
}
