import { describe, it, expect, beforeEach } from "vitest";
import { sfx, setMuted, isMuted, subscribeMuted } from "@/lib/audio";

describe("audio", () => {
  beforeEach(() => setMuted(false));

  it("começa sem mudo e alterna", () => {
    expect(isMuted()).toBe(false);
    setMuted(true);
    expect(isMuted()).toBe(true);
    setMuted(false);
    expect(isMuted()).toBe(false);
  });
  it("notifica assinantes ao mudar o mudo e permite cancelar", () => {
    const seen: boolean[] = [];
    const unsubscribe = subscribeMuted(() => seen.push(isMuted()));
    setMuted(true);
    setMuted(false);
    unsubscribe();
    setMuted(true);
    setMuted(false);
    expect(seen).toEqual([true, false]);
  });
  it("expõe os sons esperados, incluindo fim", () => {
    expect(Object.keys(sfx).sort()).toEqual(["blank", "confirm", "correct", "digit", "error", "fim"]);
  });
  it("não lança fora do navegador (window indefinido)", () => {
    expect(() => sfx.digit()).not.toThrow();
    expect(() => sfx.fim()).not.toThrow();
  });
});
