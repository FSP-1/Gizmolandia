import pygame
import random
import sys
import math

pygame.init()

WIDTH, HEIGHT = 1000, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Dice Physics Sandbox 🎲")

clock = pygame.time.Clock()

WHITE = (245, 245, 245)
BLACK = (30, 30, 30)
GRAY = (80, 80, 80)
RED = (200, 60, 60)
GREEN = (60, 180, 90)
BLUE = (70, 120, 200)
SHADOW = (50, 50, 50)

font = pygame.font.Font(None, 26)

# -------------------------
# GLOBAL PHYSICS SETTINGS
# -------------------------
physics = {
    "gravity": 0.6,
    "bounce": 0.6,
    "friction": 0.98,
    "weight": 1.0
}

# -------------------------
# UI BUTTONS
# -------------------------
add_button = pygame.Rect(20, 20, 120, 40)
remove_button = pygame.Rect(160, 20, 140, 40)

# sliders (x, y, width)
sliders = {
    "gravity": pygame.Rect(40, 100, 200, 10),
    "bounce": pygame.Rect(40, 150, 200, 10),
    "friction": pygame.Rect(40, 200, 200, 10),
    "weight": pygame.Rect(40, 250, 200, 10),
}

dragging_slider = None

# -------------------------
# DRAG CONTROL
# -------------------------
selected_die = None
drag_offset_x = 0
drag_offset_y = 0
mouse_velocity = []

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
    def __init__(self):
        self.size = 80
        self.reset()

    def reset(self):
        self.x = random.randint(300, WIDTH - 100)
        self.y = random.randint(50, 200)
        self.vx = random.uniform(-3, 3)
        self.vy = random.uniform(-5, 0)
        self.angle = random.uniform(0, 360)
        self.angular_vel = random.uniform(-5, 5)
        self.final_value = None

    def compute_top_face(self):
        return int((self.angle % 360) // 60) + 1

    def update(self):
        if self == selected_die:
            return

        # apply physics
        self.vy += physics["gravity"] * (0.5 + physics["weight"] * 0.5)
        self.x += self.vx
        self.y += self.vy

        self.angle += self.angular_vel

        self.vx *= physics["friction"]
        self.angular_vel *= 0.99

        # walls
        if self.x < 260:
            self.x = 260
            self.vx *= -physics["bounce"]
        elif self.x + self.size > WIDTH:
            self.x = WIDTH - self.size
            self.vx *= -physics["bounce"]

        # floor
        if self.y + self.size > HEIGHT - 60:
            self.y = HEIGHT - 60 - self.size

            if abs(self.vy) > 2:
                self.vy *= -physics["bounce"]
            else:
                self.vy = 0
                self.vx *= 0.9

                if self.final_value is None:
                    self.final_value = self.compute_top_face()

                if abs(self.vx) < 0.1:
                    self.vx = 0
                    self.angular_vel = 0

    def draw(self, surface):
        shadow_rect = pygame.Rect(self.x + 8, HEIGHT - 50, self.size, 10)
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

    if dist < min_dist and dist != 0:
        nx = dx / dist
        ny = dy / dist

        overlap = min_dist - dist
        d1.x += nx * overlap / 2
        d2.x -= nx * overlap / 2

        rel_vel_x = d1.vx - d2.vx
        rel_vel_y = d1.vy - d2.vy
        vel = rel_vel_x * nx + rel_vel_y * ny

        if vel < 0:
            impulse = -(1.7) * vel / 2
            d1.vx += impulse * nx
            d2.vx -= impulse * nx

# -------------------------
# DICE LIST
# -------------------------
dice = []

def add_die():
    dice.append(Die())

def remove_die():
    if dice:
        dice.pop()

# initial dice
for _ in range(3):
    add_die()

# -------------------------
# DRAW SLIDERS
# -------------------------
def draw_slider(name, rect, value, min_val, max_val):
    pygame.draw.rect(screen, GRAY, rect)
    t = (value - min_val) / (max_val - min_val)
    knob_x = rect.x + int(t * rect.width)
    pygame.draw.circle(screen, BLUE, (knob_x, rect.y + 5), 8)

    txt = font.render(f"{name}: {round(value,2)}", True, WHITE)
    screen.blit(txt, (rect.x, rect.y - 20))

# -------------------------
# MAIN LOOP
# -------------------------
while True:
    screen.fill((30, 30, 30))

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        if event.type == pygame.MOUSEBUTTONDOWN:
            mx, my = pygame.mouse.get_pos()

            # buttons
            if add_button.collidepoint(mx, my):
                add_die()
            if remove_button.collidepoint(mx, my):
                remove_die()

            # sliders
            for name, rect in sliders.items():
                if rect.collidepoint(mx, my):
                    dragging_slider = name

            # dice dragging
            for d in dice:
                rect = pygame.Rect(d.x, d.y, d.size, d.size)
                if rect.collidepoint(mx, my):
                    selected_die = d
                    drag_offset_x = mx - d.x
                    drag_offset_y = my - d.y
                    d.vx = d.vy = 0
                    mouse_velocity = []
                    break

        if event.type == pygame.MOUSEBUTTONUP:
            if selected_die:
                if len(mouse_velocity) >= 2:
                    vx = mouse_velocity[-1][0] - mouse_velocity[0][0]
                    vy = mouse_velocity[-1][1] - mouse_velocity[0][1]

                    # STRONG THROW MULTIPLIER (like your original)
                    selected_die.vx = vx * 0.4
                    selected_die.vy = vy * 0.4
                    selected_die.angular_vel = random.uniform(-12, 12)
                    selected_die.final_value = None

                selected_die = None

            dragging_slider = None


        if event.type == pygame.MOUSEMOTION:
            mx, my = pygame.mouse.get_pos()

            # slider movement
            if dragging_slider:
                rect = sliders[dragging_slider]
                t = (mx - rect.x) / rect.width
                t = max(0, min(1, t))

                if dragging_slider == "gravity":
                    physics["gravity"] = t * 2
                elif dragging_slider == "bounce":
                    physics["bounce"] = t
                elif dragging_slider == "friction":
                    physics["friction"] = 0.95 + t * 0.045
                elif dragging_slider == "weight":
                    physics["weight"] = 0.5 + t * 2
                    
            # track velocity for throwing
            if selected_die:
                mouse_velocity.append((mx, my))
                if len(mouse_velocity) > 5:
                    mouse_velocity.pop(0)
                    
            # dragging dice
            if selected_die:
                selected_die.x = mx - drag_offset_x
                selected_die.y = my - drag_offset_y

    # floor
    pygame.draw.rect(screen, GRAY, (0, HEIGHT - 50, WIDTH, 50))

    # buttons
    pygame.draw.rect(screen, GREEN, add_button, border_radius=10)
    pygame.draw.rect(screen, RED, remove_button, border_radius=10)

    screen.blit(font.render("ADD DICE", True, WHITE), (30, 30))
    screen.blit(font.render("REMOVE DICE", True, WHITE), (170, 30))

    # sliders
    draw_slider("Gravity", sliders["gravity"], physics["gravity"], 0, 2)
    draw_slider("Bounce", sliders["bounce"], physics["bounce"], 0, 1)
    draw_slider("Friction", sliders["friction"], physics["friction"], 0.9, 1)
    draw_slider("Weight", sliders["weight"], physics["weight"], 0.5, 2.5)

    # collisions
    for i in range(len(dice)):
        for j in range(i + 1, len(dice)):
            collide(dice[i], dice[j])

    # update + draw
    for d in dice:
        d.update()
        d.draw(screen)

    pygame.display.flip()
    clock.tick(60)
