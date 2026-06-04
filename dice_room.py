import pygame
import random
import sys
import math

pygame.init()

WIDTH, HEIGHT = 900, 550
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Dice FULL PRO 🎲")

clock = pygame.time.Clock()

WHITE = (245, 245, 245)
BLACK = (30, 30, 30)
GRAY = (80, 80, 80)
RED = (200, 60, 60)
SHADOW = (50, 50, 50)

# -------------------------
# DRAG CONTROL
# -------------------------
selected_die = None
drag_offset_x = 0
drag_offset_y = 0
mouse_velocity = []

# -------------------------
# BOTÓN RESET
# -------------------------
reset_button = pygame.Rect(20, 20, 120, 40)

# -------------------------
# DRAW PIPS
# -------------------------
def draw_pips(surface, value, rect):
    cx, cy = rect.center
    offset = rect.width // 4
    r = 6

    def pip(x, y):
        pygame.draw.circle(surface, BLACK, (x, y), r)

    if value == 1:
        pip(cx, cy)
    elif value == 2:
        pip(cx - offset, cy - offset)
        pip(cx + offset, cy + offset)
    elif value == 3:
        pip(cx, cy)
        pip(cx - offset, cy - offset)
        pip(cx + offset, cy + offset)
    elif value == 4:
        pip(cx - offset, cy - offset)
        pip(cx + offset, cy - offset)
        pip(cx - offset, cy + offset)
        pip(cx + offset, cy + offset)
    elif value == 5:
        draw_pips(surface, 4, rect)
        pip(cx, cy)
    elif value == 6:
        pip(cx - offset, cy - offset)
        pip(cx - offset, cy)
        pip(cx - offset, cy + offset)
        pip(cx + offset, cy - offset)
        pip(cx + offset, cy)
        pip(cx + offset, cy + offset)

# -------------------------
# DIE CLASS
# -------------------------
class Die:
    def __init__(self, x):
        self.reset(x)

    def reset(self, x):
        self.x = x
        self.y = random.randint(50, 150)
        self.size = 80

        self.vx = random.uniform(-3, 3)
        self.vy = random.uniform(-5, 0)

        self.gravity = 0.6
        self.friction = 0.98
        self.bounce = 0.6

        self.angle = random.uniform(0, 360)
        self.angular_vel = random.uniform(-5, 5)

        self.final_value = None

    def compute_top_face(self):
        angle = self.angle % 360
        return int(angle // 60) + 1

    def update(self):
        if self == selected_die:
            return

        self.vy += self.gravity
        self.x += self.vx
        self.y += self.vy

        self.angle += self.angular_vel

        self.vx *= self.friction
        self.angular_vel *= 0.99

        # paredes laterales REALES
        if self.x < 0:
            self.x = 0
            self.vx *= -self.bounce
        elif self.x + self.size > WIDTH:
            self.x = WIDTH - self.size
            self.vx *= -self.bounce

        # suelo
        if self.y + self.size > HEIGHT - 60:
            self.y = HEIGHT - 60 - self.size

            if abs(self.vy) > 2:
                self.vy *= -self.bounce
                self.angular_vel *= 0.7
            else:
                self.vy = 0
                self.vx *= 0.8

                if self.final_value is None:
                    self.final_value = self.compute_top_face()

                if abs(self.vx) < 0.1:
                    self.vx = 0
                    self.angular_vel = 0

    def draw(self, surface):
        shadow_rect = pygame.Rect(self.x + 8, HEIGHT - 50, self.size, 12)
        pygame.draw.ellipse(surface, SHADOW, shadow_rect)

        dice_surface = pygame.Surface((self.size, self.size), pygame.SRCALPHA)
        pygame.draw.rect(dice_surface, WHITE, (0, 0, self.size, self.size), border_radius=15)

        value = self.final_value if self.final_value else 1
        draw_pips(dice_surface, value, dice_surface.get_rect())

        rotated = pygame.transform.rotate(dice_surface, self.angle)
        surface.blit(rotated, (self.x, self.y))

# -------------------------
# COLLISION
# -------------------------
def collide(d1, d2):
    dx = (d1.x + 40) - (d2.x + 40)
    dy = (d1.y + 40) - (d2.y + 40)
    dist = math.hypot(dx, dy)
    min_dist = 80

    if dist == 0:
        dist = 0.1

    if dist < min_dist:
        nx = dx / dist
        ny = dy / dist
        overlap = min_dist - dist

        d1.x += nx * overlap / 2
        d1.y += ny * overlap / 2
        d2.x -= nx * overlap / 2
        d2.y -= ny * overlap / 2

        rel_vel_x = d1.vx - d2.vx
        rel_vel_y = d1.vy - d2.vy
        vel_along_normal = rel_vel_x * nx + rel_vel_y * ny

        if vel_along_normal > 0:
            return

        impulse = -(1.7) * vel_along_normal / 2
        d1.vx += impulse * nx
        d1.vy += impulse * ny
        d2.vx -= impulse * nx
        d2.vy -= impulse * ny

        d1.angular_vel += random.uniform(-2, 2)
        d2.angular_vel += random.uniform(-2, 2)

        d1.final_value = None
        d2.final_value = None

# -------------------------
# CREATE DICE
# -------------------------
dice = [Die(200), Die(400), Die(600)]

def roll():
    for d in dice:
        d.vx = random.uniform(-6, 6)
        d.vy = random.uniform(-15, -8)
        d.angular_vel = random.uniform(-10, 10)
        d.final_value = None

def reset_all():
    positions = [200, 400, 600]
    for i, d in enumerate(dice):
        d.reset(positions[i])

# -------------------------
# MAIN LOOP
# -------------------------
while True:
    screen.fill((30, 30, 30))

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        # teclado
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                roll()

        # mouse click
        if event.type == pygame.MOUSEBUTTONDOWN:
            mx, my = pygame.mouse.get_pos()

            # botón reset
            if reset_button.collidepoint(mx, my):
                reset_all()

            for d in dice:
                rect = pygame.Rect(d.x, d.y, d.size, d.size)
                if rect.collidepoint(mx, my):
                    selected_die = d
                    drag_offset_x = mx - d.x
                    drag_offset_y = my - d.y
                    d.vx = d.vy = 0
                    mouse_velocity = []
                    break

        # mover
        if event.type == pygame.MOUSEMOTION and selected_die:
            mx, my = pygame.mouse.get_pos()
            selected_die.x = mx - drag_offset_x
            selected_die.y = my - drag_offset_y

            mouse_velocity.append((mx, my))
            if len(mouse_velocity) > 5:
                mouse_velocity.pop(0)

        # soltar
        if event.type == pygame.MOUSEBUTTONUP:
            if selected_die:
                if len(mouse_velocity) >= 2:
                    vx = mouse_velocity[-1][0] - mouse_velocity[0][0]
                    vy = mouse_velocity[-1][1] - mouse_velocity[0][1]

                    selected_die.vx = vx * 0.3
                    selected_die.vy = vy * 0.3
                    selected_die.angular_vel = random.uniform(-8, 8)
                    selected_die.final_value = None

                selected_die = None

    # suelo
    pygame.draw.rect(screen, GRAY, (0, HEIGHT - 50, WIDTH, 50))

    # paredes visibles
    pygame.draw.rect(screen, GRAY, (0, 0, 10, HEIGHT))
    pygame.draw.rect(screen, GRAY, (WIDTH - 10, 0, 10, HEIGHT))

    # colisiones
    for i in range(len(dice)):
        for j in range(i + 1, len(dice)):
            collide(dice[i], dice[j])

    # update/draw
    for d in dice:
        d.update()
        d.draw(screen)

    # botón reset
    pygame.draw.rect(screen, RED, reset_button, border_radius=10)
    font = pygame.font.Font(None, 30)
    txt = font.render("RESET", True, WHITE)
    screen.blit(txt, (reset_button.x + 20, reset_button.y + 8))

    # UI
    font2 = pygame.font.Font(None, 28)
    text = font2.render("ESPACIO = tirar | Drag = lanzar | RESET boton", True, WHITE)
    screen.blit(text, (220, 20))

    pygame.display.flip()
    clock.tick(60)