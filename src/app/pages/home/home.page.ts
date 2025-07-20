import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopoverController, ModalController, ActionSheetController } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';
import { Constants } from 'src/app/config/constants';
import { UserMenuPopoverComponent } from 'src/app/components/user-menu-popover/user-menu-popover.component';
import { AuthService } from 'src/app/services/auth.service';
import { DeleteAccountModalComponent } from 'src/app/components/delete-account-modal/delete-account-modal.component';
import { IonicModule } from '@ionic/angular';
import { TaskService, Task } from 'src/app/services/task.service';
import { CommonService } from 'src/app/services/common.service';
import { Observable, Subscription } from 'rxjs';
import { ThemeToggleComponent } from 'src/app/components/theme-toggle/theme-toggle.component';
import { AddEditTaskPage } from '../add-edit-task/add-edit-task.page'; // Import the new page

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  providers: [StorageService],
  imports: [IonicModule, FormsModule, CommonModule, ThemeToggleComponent],
})
export class HomePage implements OnInit, OnDestroy {
  quotes: string[] = [
    'Believe in yourself!',
    'Start where you are. Use what you have. Do what you can.',
    'Success is the sum of small efforts repeated day in and day out.',
    'Don\'t watch the clock; do what it does. Keep going.',
    'The secret of getting ahead is getting started.',
    'Your limitation—it\'s only your imagination.',
    'Push yourself, because no one else is going to do it for you.',
    'Great things never come from comfort zones.',
    'Dream it. Wish it. Do it.',
    'Success doesn\'t just find you. You have to go out and get it.'
  ];

  currentQuote: string = '';
  quoteIndex: number = 0;
  name = '';
  email = '';

  // Task observables
  pendingTasks$: Observable<Task[]>;
  inProgressTasks$: Observable<Task[]>;
  completedTasks$: Observable<Task[]>;
  loading$: Observable<boolean>;

  newTask: Omit<Task, '_id'> = {
    title: '',
    description: '',
    priority: 'low',
    status: 'pending'
  };

  editingTaskId: string | null = null;
  showAddTaskForm = false;

  private subscriptions: Subscription[] = [];

  constructor(
    public routerLink: RouterLink,
    private storageService: StorageService,
    private popoverCtrl: PopoverController,
    private router: Router,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private taskService: TaskService,
    private commonService: CommonService,
    private actionSheetCtrl: ActionSheetController // <-- Add this
  ) {
    // Initialize observables
    this.pendingTasks$ = this.taskService.pendingTasks$;
    this.inProgressTasks$ = this.taskService.inProgressTasks$;
    this.completedTasks$ = this.taskService.completedTasks$;
    this.loading$ = this.taskService.loading$;
  }

  ngOnInit() {
    this.quotesAnimation();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async ionViewWillEnter() {
    await this.getUserData();
    this.loadTasks();
  }

  loadTasks() {
    const sub = this.taskService.getAllTasks().subscribe({
      next: (res) => {
        if (!res.success) {
          this.commonService.presentToast(res.message || 'Failed to load tasks', 'danger');
        }
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.commonService.presentToast('Failed to load tasks: ' + (err.error?.message || err.message), 'danger');
      }
    });
    this.subscriptions.push(sub);
  }

  async openAddTaskModal(task?: Task) {
    console.log('task', task);

    if (!task) {
      task = {
        title: '',
        description: '',
        priority: 'low',
        status: 'pending'
      };
    }

    const modal = await this.modalCtrl.create({
      component: AddEditTaskPage,
      componentProps: {
        task: task
      },
      breakpoints: [0, 0.9],
      initialBreakpoint: 0.9,
      handle: true,
      backdropDismiss: true,
      showBackdrop: true,
      cssClass: 'add-edit-task-modal',
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'backdrop' || role === 'cancel') {
      // Modal dismissed without saving, refresh tasks if needed
      this.loadTasks();
    } else if (data && data.refresh) {
      this.loadTasks();
    }
  }

  editTask(task: Task) {
    this.openAddTaskModal(task);
  }

  async deleteTask(taskId: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Delete Task',
      subHeader: 'Are you sure you want to delete this task?',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          cssClass: 'action-sheet-header-color', // Custom class for color
          handler: () => {
            const sub = this.taskService.deleteTask(taskId).subscribe({
              next: (res) => {
                if (res.success) {
                  this.commonService.presentToast(res.message, 'success');
                } else {
                  this.commonService.presentToast(res.message || 'Failed to delete task', 'danger');
                }
              },
              error: (err) => {
                console.error(err);
                this.commonService.presentToast('Failed to delete task: ' + (err.error?.message || err.message), 'danger');
              }
            });
            this.subscriptions.push(sub);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close',
          cssClass: 'action-sheet-header-color' // Custom class for color
        }
      ]
    });
    await actionSheet.present();
  }

  toggleTaskStatus(task: Task) {
    let newStatus: Task['status'];

    switch (task.status) {
      case 'pending':
        newStatus = 'in-progress';
        break;
      case 'in-progress':
        newStatus = 'completed';
        break;
      case 'completed':
        newStatus = 'pending';
        break;
      default:
        newStatus = 'pending';
    }

    const sub = this.taskService.updateTaskStatus(task._id!, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.commonService.presentToast(`Task moved to ${newStatus.replace('-', ' ')}`, 'success');
        } else {
          this.commonService.presentToast(res.message || 'Failed to update task status', 'danger');
        }
      },
      error: (err) => {
        console.error(err);
        this.commonService.presentToast('Failed to update task status: ' + (err.error?.message || err.message), 'danger');
      }
    });
    this.subscriptions.push(sub);
  }

  resetForm() {
    this.newTask = { title: '', description: '', priority: 'low', status: 'pending' };
    this.editingTaskId = null;
    this.showAddTaskForm = false;
  }

  toggleAddTaskForm() {
    this.showAddTaskForm = !this.showAddTaskForm;
    if (!this.showAddTaskForm) {
      this.resetForm();
    }
  }

  getPriorityColor(priority: string): string {
    return this.taskService.getPriorityColor(priority);
  }

  getStatusIcon(status: string): string {
    return this.taskService.getStatusIcon(status);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'medium';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      default: return 'medium';
    }
  }

  async openUserMenu(ev: Event) {
    const popover = await this.popoverCtrl.create({
      component: UserMenuPopoverComponent,
      event: ev,
      alignment: 'start',
      side: 'bottom',
      translucent: true,
      showBackdrop: false,
      dismissOnSelect: true,
    });
    await popover.present();
    const { data } = await popover.onDidDismiss();
    if (data) {
      if (data == 'logout') {
        await this.logout();
      } else if (data == 'profile') {
        this.router.navigate(['profile']);
      } else if (data == 'reset-password') {
        this.router.navigate(['reset-password']);
      } else if (data == 'delete-account') {
        await this.deleteAccount();
      }
    }
  }

  async deleteAccount() {
    const modal = await this.modalCtrl.create({
      component: DeleteAccountModalComponent,
      breakpoints: [0, 0.5],
      initialBreakpoint: 0.5,
      handle: true,
      backdropDismiss: false,
      showBackdrop: true,
      cssClass: 'delete-modal',
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.password) {
      try {
        const res = await this.authService.deleteAccount(data.password);
        if (res.success) {
          this.commonService.presentToast(res.message, 'success');
        } else {
          this.commonService.presentToast(res.message, 'danger');
          return;
        }
        await this.storageService.clearAll();
        this.router.navigate(['login']);
      } catch (error: any) {
        console.error('Delete account failed', error);
        this.commonService.presentToast('Error: ' + error.error?.message || 'Failed to delete account.', 'danger');
      }
    }
  }

  async logout() {
    const res = await this.authService.logout();
    if (res.success) {
      this.commonService.presentToast(res.message, 'success');
    } else {
      this.commonService.presentToast(res.message, 'danger');
      return;
    }
    await this.storageService.clearAll();
    this.router.navigate(['login']);
  }

  async getUserData() {
    this.name = await this.storageService.getItem(Constants.USER_NAME);
    this.email = await this.storageService.getItem(Constants.USER_EMAIL);
  }

  quotesAnimation() {
    this.currentQuote = this.quotes[this.quoteIndex];
    setInterval(() => {
      this.quoteIndex = (this.quoteIndex + 1) % this.quotes.length;
      this.currentQuote = this.quotes[this.quoteIndex];
    }, 5000);
  }

  trackByTaskId(index: number, task: Task): string {
    return task._id || index.toString();
  }
}


