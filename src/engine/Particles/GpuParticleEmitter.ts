import { TransformComponent } from '../EntityComponentSystem';
import { Entity } from '../EntityComponentSystem/Entity';
import {
  EmitterType,
  Engine,
  ExcaliburGraphicsContextWebGL,
  GpuParticleConfig,
  GpuParticleState,
  GraphicsComponent,
  Random,
  vec,
  Vector
} from '../';
import { ParticleEmitterArgs, ParticleTransform } from './Particles';

export class GpuParticleEmitter extends Entity {
  // TODO new renderer plugin
  // TODO transform feedback
  // TODO random glsl

  public particle: GpuParticleConfig = {
    /**
     * Gets or sets the life of each particle in milliseconds
     */
    life: 2000,
    transform: ParticleTransform.Global,
    graphic: undefined,
    opacity: 1,
    angularVelocity: 0,
    focus: undefined,
    focusAccel: undefined,
    randomRotation: false
  };

  public transform = new TransformComponent();
  public graphics = new GraphicsComponent();
  public state: GpuParticleState;
  public isEmitting: boolean = false;
  public emitRate: number = 1;
  public emitterType: EmitterType = EmitterType.Rectangle;
  public radius: number = 0;

  public get pos() {
    return this.transform.pos;
  }

  public set pos(pos: Vector) {
    this.transform.pos = pos;
  }

  public get z() {
    return this.transform.z;
  }

  public set z(z: number) {
    this.transform.z = z;
  }

  constructor(config: ParticleEmitterArgs & { maxParticles?: number; particle?: GpuParticleConfig }) {
    super({ name: `GpuParticleEmitter` });
    this.addComponent(this.transform);
    this.addComponent(this.graphics);
    (this.graphics.onPostDraw as any) = this.draw.bind(this);

    const { particle, x, y, z, pos, isEmitting, emitRate, emitterType, radius, random } = { ...config };

    this.pos = pos ?? vec(x ?? 0, y ?? 0);

    this.z = z ?? 0;

    this.isEmitting = isEmitting ?? this.isEmitting;

    this.emitRate = emitRate ?? this.emitRate;

    this.emitterType = emitterType ?? this.emitterType;

    this.radius = radius ?? this.radius;

    this.particle = { ...this.particle, ...particle };

    this.state = new GpuParticleState(this, random ?? new Random(), this.particle);
    // TODO figure out emit rate and how many particles should be active
  }

  public _initialize(engine: Engine): void {
    super._initialize(engine);
    const context = engine.graphicsContext as ExcaliburGraphicsContextWebGL;
    this.state.initialize(context.__gl, context);
  }

  private _particlesToEmit = 0;
  public update(engine: Engine, delta: number): void {
    super.update(engine, delta);

    if (this.isEmitting) {
      this._particlesToEmit += this.emitRate * (delta / 1000);
      if (this._particlesToEmit > 1.0) {
        this.emitParticles(Math.floor(this._particlesToEmit));
        this._particlesToEmit = this._particlesToEmit - Math.floor(this._particlesToEmit);
      }
    }
  }

  public emitParticles(particleCount: number) {
    this.state.emitParticles(particleCount);
  }

  draw(ctx: ExcaliburGraphicsContextWebGL, elapsedMilliseconds: number) {
    ctx.draw<ex.ParticleRenderer>('ex.particle', this.state, elapsedMilliseconds);
  }
}
